import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AdminPageQueryDto } from './dto/admin-query.dto';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminPageQueryDto) {
    const [totalItems, orders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: true, payment: true },
      }),
    ]);

    return {
      data: orders.map((order) => ({
        id: order.id,
        customerName: order.user.name,
        customerEmail: order.user.email,
        createdAt: order.createdAt.toISOString(),
        total: order.total.toString(),
        status: order.status,
        paymentStatus: order.payment?.status ?? null,
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async findById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        payment: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total.toString(),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: (Number(item.unitPrice.toString()) * item.quantity).toFixed(2),
      })),
      payment: order.payment
        ? {
            status: order.payment.status,
            paypalOrderId: order.payment.paypalOrderId,
            paypalCaptureId: order.payment.paypalCaptureId,
            amount: order.payment.amount.toString(),
          }
        : null,
    };
  }
}
