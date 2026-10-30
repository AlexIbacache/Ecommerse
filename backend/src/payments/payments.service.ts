import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toAmount, toCents } from '../common/utils/money';
import { PrismaService } from '../database/prisma.service';
import type { CapturePaymentDto } from './dto/capture-payment.dto';
import { PaypalClient, type PaypalOrder } from './paypal.client';

class StockConflictError extends Error {}

function amountToCents(order: PaypalOrder): number | null {
  const unit = order.purchase_units?.[0];
  // La respuesta de capture trae el importe en payments.captures[].amount;
  // la de getOrder, en purchase_units[].amount. Se aceptan ambas.
  const value =
    unit?.payments?.captures?.[0]?.amount?.value ?? unit?.amount?.value;

  if (!value) {
    return null;
  }
  return toCents(value);
}

function captureIdOf(order: PaypalOrder): string {
  return order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? order.id;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paypal: PaypalClient,
  ) {}

  async createPaypalOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.status !== 'PENDIENTE_PAGO') {
      throw new HttpException(
        'El pedido no está pendiente de pago',
        HttpStatus.CONFLICT,
      );
    }

    if (order.payment?.paypalOrderId) {
      return { orderId, paypalOrderId: order.payment.paypalOrderId };
    }

    const amount = toAmount(toCents(order.total));

    let paypalOrder: PaypalOrder;
    try {
      paypalOrder = await this.paypal.createOrder(amount);
    } catch {
      throw new HttpException(
        'No pudimos iniciar el pago con PayPal.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    await this.prisma.payment.create({
      data: {
        orderId,
        paypalOrderId: paypalOrder.id,
        status: 'CREADA',
        amount: order.total,
      },
    });

    return { orderId, paypalOrderId: paypalOrder.id };
  }

  async capture(userId: number, dto: CapturePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { paypalOrderId: dto.paypalOrderId },
      include: { order: { include: { items: true } } },
    });

    if (!payment || payment.order.userId !== userId) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status === 'COMPLETADA') {
      return this.detail(payment.orderId);
    }

    const order = payment.order;

    let paypalOrder: PaypalOrder;
    try {
      paypalOrder = await this.paypal.getOrder(payment.paypalOrderId!);
    } catch {
      throw new HttpException(
        'No pudimos verificar el pago con PayPal.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (paypalOrder.status !== 'COMPLETED') {
      let captured: PaypalOrder;
      try {
        captured = await this.paypal.captureOrder(payment.paypalOrderId!);
      } catch {
        await this.markFailed(order.id, payment.id, 'CAPTURE_FAILED');
        throw new HttpException(
          'El pago fue rechazado por PayPal.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      if (captured.status !== 'COMPLETED') {
        await this.markFailed(order.id, payment.id, 'NOT_COMPLETED');
        throw new HttpException(
          'El pago no se completó.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      paypalOrder = captured;
    }

    const paidCents = amountToCents(paypalOrder);
    if (paidCents === null || paidCents !== toCents(order.total)) {
      await this.markFailed(order.id, payment.id, 'AMOUNT_MISMATCH');
      throw new HttpException(
        'Inconsistencia en el importe del pago.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return this.confirm(order.id, payment.id, paypalOrder);
  }

  async reconcile(userId: number, orderId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { order: { id: orderId, userId } },
      include: { order: { include: { items: true } } },
    });

    if (!payment || !payment.paypalOrderId) {
      return;
    }

    const orderStatus = payment.order.status;
    if (orderStatus !== 'PENDIENTE_PAGO' && orderStatus !== 'PAGO_FALLIDO') {
      return;
    }

    try {
      const paypalOrder = await this.paypal.getOrder(payment.paypalOrderId);

      if (paypalOrder.status === 'COMPLETED') {
        if (amountToCents(paypalOrder) === toCents(payment.order.total)) {
          await this.confirm(payment.orderId, payment.id, paypalOrder);
        } else {
          await this.markFailed(payment.orderId, payment.id, 'AMOUNT_MISMATCH');
        }
      } else if (paypalOrder.status === 'APPROVED') {
        const captured = await this.paypal.captureOrder(payment.paypalOrderId);
        if (
          captured.status === 'COMPLETED' &&
          amountToCents(captured) === toCents(payment.order.total)
        ) {
          await this.confirm(payment.orderId, payment.id, captured);
        } else {
          await this.markFailed(payment.orderId, payment.id, 'CAPTURE_FAILED');
        }
      }
    } catch {
      // Si PayPal no responde, el pedido permanece pendiente para reintentar.
    }
  }

  private async confirm(orderId: number, paymentId: number, paypalOrder: PaypalOrder) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });

    try {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });

        if (!current) {
          return;
        }

        // Ya resuelto: no se vuelve a descontar stock ni a marcar pagado.
        if (current.status === 'PAGADO' || current.status === 'CANCELADO') {
          return;
        }

        for (const item of items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (result.count === 0) {
            throw new StockConflictError();
          }
        }

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETADA',
            paypalCaptureId: captureIdOf(paypalOrder),
            rawPayload: paypalOrder as unknown as Prisma.InputJsonValue,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PAGADO' },
        });
      });
    } catch (error) {
      if (error instanceof StockConflictError) {
        await this.markFailed(orderId, paymentId, 'STOCK_CONFLICT');
        throw new HttpException(
          'Uno de los productos se agotó antes de confirmar el pago.',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }

    return this.detail(orderId);
  }

  private async markFailed(orderId: number, paymentId: number, reason: string) {
    console.warn(`[payments] pedido ${orderId} fallido: ${reason}`);
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FALLIDA' },
    });
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAGO_FALLIDO' },
    });
  }

  private async detail(orderId: number) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payment: true },
    });

    return {
      id: order.id,
      status: order.status,
      total: order.total.toString(),
      currency: order.currency,
      paymentStatus: order.payment?.status ?? null,
    };
  }
}
