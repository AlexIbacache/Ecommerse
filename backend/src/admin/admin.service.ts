import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ingresos de pedidos PAGADO por día (UTC), con los días sin ventas en cero. */
  async dailySales(days: number) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const rows = await this.prisma.$queryRaw<
      { day: string; revenue: string; orders: number }[]
    >`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             SUM(total)::text AS revenue,
             COUNT(*)::int AS orders
      FROM "Order"
      WHERE status = 'PAGADO' AND created_at >= ${start}
      GROUP BY 1
      ORDER BY 1
    `;

    const byDay = new Map(rows.map((row) => [row.day, row]));
    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const row = byDay.get(key);
      return {
        date: key,
        revenue: row?.revenue ?? '0',
        orders: row?.orders ?? 0,
      };
    });

    const totalCents = rows.reduce(
      (sum, row) => sum + Math.round(Number(row.revenue) * 100),
      0,
    );

    return {
      days,
      series,
      totals: {
        revenue: (totalCents / 100).toFixed(2),
        orders: rows.reduce((sum, row) => sum + row.orders, 0),
      },
    };
  }

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
