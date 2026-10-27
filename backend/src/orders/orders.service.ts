import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toAmount, toCents } from '../common/utils/money';
import { PrismaService } from '../database/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    const ids = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    const problems: { productId: number; reason: string }[] = [];

    for (const item of dto.items) {
      const product = byId.get(item.productId);

      if (!product || !product.isActive) {
        problems.push({ productId: item.productId, reason: 'UNAVAILABLE' });
      } else if (product.stock < item.quantity) {
        problems.push({ productId: item.productId, reason: 'INSUFFICIENT_STOCK' });
      }
    }

    if (problems.length > 0) {
      throw new ConflictException({
        message: 'Algunos productos no están disponibles',
        problems,
      });
    }

    const totalCents = dto.items.reduce(
      (sum, item) =>
        sum + toCents(byId.get(item.productId)!.price) * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'PENDIENTE_PAGO',
        total: toAmount(totalCents),
        items: {
          create: dto.items.map((item) => {
            const product = byId.get(item.productId)!;
            return {
              productId: product.id,
              quantity: item.quantity,
              unitPrice: product.price,
            };
          }),
        },
      },
      include: { items: { include: { product: true } }, payment: true },
    });

    return this.toDetail(order);
  }

  async listForUser(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payment: true },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total.toString(),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      paymentStatus: order.payment?.status ?? null,
    }));
  }

  async detailForUser(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } }, payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.toDetail(order);
  }

  async cancel(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.status !== 'PENDIENTE_PAGO') {
      return this.detailForUser(userId, orderId);
    }

    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { orderId, status: 'CREADA' },
        data: { status: 'CANCELADA' },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELADO' },
      }),
    ]);

    return this.detailForUser(userId, orderId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDetail(order: any) {
    return {
      id: order.id,
      status: order.status,
      total: order.total.toString(),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          productId: item.productId,
          name: item.product.name,
          slug: item.product.slug,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
        }),
      ),
      payment: order.payment
        ? {
            status: order.payment.status,
            paypalOrderId: order.payment.paypalOrderId,
          }
        : null,
    };
  }
}
