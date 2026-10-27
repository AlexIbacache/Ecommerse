import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

function cookieHeader(setCookie: unknown, name: string): string {
  const list: string[] = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie as string]
      : [];
  const raw = list.find((cookie) => cookie.startsWith(`${name}=`));
  if (!raw) {
    throw new Error(`cookie ${name} no presente`);
  }
  return raw.split(';')[0];
}

let app: INestApplication;
let http: ReturnType<typeof request>;
let prisma: PrismaService;
let adminCookie: string;
let clientCookie: string;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  http = request(await app.getUrl());
  prisma = app.get(PrismaService);

  const adminLogin = await http
    .post('/auth/login')
    .send({ email: 'admin@demo.local', password: 'Admin123!' })
    .expect(200);
  adminCookie = cookieHeader(adminLogin.headers['set-cookie'], 'access_token');

  const clientLogin = await http
    .post('/auth/login')
    .send({ email: 'cliente@demo.local', password: 'Cliente123!' })
    .expect(200);
  clientCookie = cookieHeader(clientLogin.headers['set-cookie'], 'access_token');
});

afterAll(async () => {
  await app.close();
});

describe('dashboard administrativo (e2e)', () => {
  it('devuelve métricas consistentes con la base de datos', async () => {
    const res = await http.get('/admin/metrics').set('Cookie', adminCookie);

    expect(res.status).toBe(200);

    const [products, paidOrders, revenueAggregate] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({ where: { status: 'PAGADO' } }),
      prisma.order.aggregate({
        where: { status: 'PAGADO' },
        _sum: { total: true },
      }),
    ]);

    expect(res.body.totalProducts).toBe(products);
    expect(res.body.totalSales).toBe(paidOrders);
    expect(res.body.revenue).toBe(
      revenueAggregate._sum.total ? revenueAggregate._sum.total.toString() : '0',
    );
    expect(Array.isArray(res.body.recentOrders)).toBe(true);
    expect(Array.isArray(res.body.lowStock)).toBe(true);
    expect(Array.isArray(res.body.statusDistribution)).toBe(true);
  });

  it('rechaza a un cliente con 403', async () => {
    const res = await http.get('/admin/metrics').set('Cookie', clientCookie);
    expect(res.status).toBe(403);
  });

  it('rechaza sin autenticación con 401', async () => {
    const res = await http.get('/admin/metrics');
    expect(res.status).toBe(401);
  });
});
