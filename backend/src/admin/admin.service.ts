import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics() {
    const [
      totalProducts,
      totalSales,
      revenueAggregate,
      recentOrders,
      lowStock,
      distribution,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count({ where: { status: 'PAGADO' } }),
      this.prisma.order.aggregate({
        where: { status: 'PAGADO' },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stock: { lt: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: 'asc' },
        take: 5,
        select: { id: true, name: true, stock: true },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return {
      totalProducts,
      totalSales,
      revenue: revenueAggregate._sum.total
        ? revenueAggregate._sum.total.toString()
        : '0',
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customerName: order.user.name,
        createdAt: order.createdAt.toISOString(),
        total: order.total.toString(),
        status: order.status,
      })),
      lowStock: lowStock.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
      })),
      statusDistribution: distribution.map((entry) => ({
        status: entry.status,
        count: entry._count._all,
      })),
    };
  }
}
