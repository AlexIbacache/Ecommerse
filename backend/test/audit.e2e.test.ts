import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `audit${Date.now()}`;

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

interface AuditItem {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  summary: string;
  details: string | null;
  actor: { id: number; name: string; email: string } | null;
}

let app: INestApplication;
let http: ReturnType<typeof request>;
let prisma: PrismaService;
let adminCookie: string;
let clientCookie: string;
let adminId: number;
let categoryId: number;
let productId: number;
const orderIds: number[] = [];

async function auditFor(entityType: string, entityId: number) {
  const res = await http
    .get('/admin/audit?pageSize=50')
    .set('Cookie', adminCookie)
    .expect(200);
  return (res.body.data as AuditItem[]).filter(
    (item) => item.entityType === entityType && item.entityId === entityId,
  );
}

async function totalAuditEntries(): Promise<number> {
  const res = await http
    .get('/admin/audit?pageSize=1')
    .set('Cookie', adminCookie)
    .expect(200);
  return res.body.meta.totalItems as number;
}

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
  adminId = adminLogin.body.id ?? adminLogin.body.user?.id;

  const clientLogin = await http
    .post('/auth/login')
    .send({ email: 'cliente@demo.local', password: 'Cliente123!' })
    .expect(200);
  clientCookie = cookieHeader(clientLogin.headers['set-cookie'], 'access_token');

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin@demo.local' },
  });
  adminId = admin.id;

  categoryId = (
    await prisma.category.findFirstOrThrow({ where: { slug: 'audio' } })
  ).id;
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: runId } } });
  await prisma.auditLog.deleteMany({
    where: { summary: { startsWith: runId } },
  });
  await app.close();
});

describe('registro de actividad del admin (e2e)', () => {
  it('registra la creación de un producto con su autor', async () => {
    const res = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({
        name: `${runId} Producto`,
        description: 'Producto de prueba para el registro de actividad.',
        price: 20,
        categoryId,
        stock: 4,
        images: ['https://picsum.photos/seed/audit-test/800/800'],
      })
      .expect(201);
    productId = res.body.id;

    const entries = await auditFor('PRODUCT', productId);
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('PRODUCT_CREATED');
    expect(entries[0].summary).toBe(`${runId} Producto`);
    expect(entries[0].actor?.id).toBe(adminId);
    expect(entries[0].actor?.email).toBe('admin@demo.local');
  });

  it('registra qué campos cambiaron al editar', async () => {
    await http
      .patch(`/admin/products/${productId}`)
      .set('Cookie', adminCookie)
      .send({ price: 25, stock: 9 })
      .expect(200);

    const updated = (await auditFor('PRODUCT', productId)).find(
      (item) => item.action === 'PRODUCT_UPDATED',
    );
    expect(updated?.details).toBe('Cambios: precio, stock');
  });

  it('no registra nada si la operación falla', async () => {
    const before = await totalAuditEntries();

    await http
      .patch('/admin/products/999999999')
      .set('Cookie', adminCookie)
      .send({ stock: 1 })
      .expect(404);
    await http
      .patch(`/admin/products/${productId}`)
      .set('Cookie', adminCookie)
      .send({ price: -5 })
      .expect(400);

    expect(await totalAuditEntries()).toBe(before);
  });

  it('registra ocultar, restaurar y eliminar un comentario (sin guardar su texto)', async () => {
    const created = await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', clientCookie)
      .send({ content: 'texto privado del comentario' })
      .expect(201);
    const commentId = created.body.id as number;

    await http
      .patch(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie)
      .send({ status: 'OCULTO' })
      .expect(200);
    // Repetir el mismo estado no genera una entrada nueva.
    await http
      .patch(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie)
      .send({ status: 'OCULTO' })
      .expect(200);
    await http
      .patch(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie)
      .send({ status: 'VISIBLE' })
      .expect(200);
    await http
      .delete(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const entries = await auditFor('COMMENT', commentId);
    expect(entries.map((item) => item.action).sort()).toEqual([
      'COMMENT_DELETED',
      'COMMENT_HIDDEN',
      'COMMENT_RESTORED',
    ]);
    expect(entries.every((item) => item.summary === `${runId} Producto`)).toBe(
      true,
    );
    expect(JSON.stringify(entries)).not.toContain('texto privado');
  });

  it('desactiva en vez de eliminar un producto con ventas y lo registra', async () => {
    const withSale = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({
        name: `${runId} Con ventas`,
        description: 'Producto con ventas asociadas para la prueba.',
        price: 10,
        categoryId,
        stock: 3,
        images: ['https://picsum.photos/seed/audit-sale/800/800'],
      })
      .expect(201);
    const saleProductId = withSale.body.id as number;

    const order = await prisma.order.create({
      data: {
        userId: adminId,
        total: '10.00',
        status: 'PAGADO',
        items: {
          create: [
            {
              productId: saleProductId,
              quantity: 1,
              unitPrice: '10.00',
            },
          ],
        },
      },
    });
    orderIds.push(order.id);

    await http
      .delete(`/admin/products/${saleProductId}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const entries = await auditFor('PRODUCT', saleProductId);
    expect(entries.map((item) => item.action)).toContain('PRODUCT_DEACTIVATED');
  });

  it('conserva la entrada aunque el producto se elimine', async () => {
    await http
      .delete(`/admin/products/${productId}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const entries = await auditFor('PRODUCT', productId);
    expect(entries.map((item) => item.action)).toContain('PRODUCT_DELETED');
    expect(entries.map((item) => item.action)).toContain('PRODUCT_CREATED');
  });

  it('solo el administrador puede consultar el registro', async () => {
    await http.get('/admin/audit').expect(401);
    await http.get('/admin/audit').set('Cookie', clientCookie).expect(403);
  });

  it('valida la paginación', async () => {
    await http
      .get('/admin/audit?pageSize=0')
      .set('Cookie', adminCookie)
      .expect(400);
    await http
      .get('/admin/audit?page=abc')
      .set('Cookie', adminCookie)
      .expect(400);
  });
});

describe('ventas por día (e2e)', () => {
  it('devuelve la serie completa y consistente con los pedidos pagados', async () => {
    const order = await prisma.order.create({
      data: { userId: adminId, total: '12.34', status: 'PAGADO' },
    });
    orderIds.push(order.id);

    const res = await http
      .get('/admin/sales/daily')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(res.body.days).toBe(30);
    expect(res.body.series).toHaveLength(30);

    const dates = (res.body.series as { date: string }[]).map((p) => p.date);
    expect([...dates].sort()).toEqual(dates);
    expect(dates[29]).toBe(new Date().toISOString().slice(0, 10));

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 29);
    const expected = await prisma.order.aggregate({
      where: { status: 'PAGADO', createdAt: { gte: start } },
      _sum: { total: true },
      _count: true,
    });

    expect(res.body.totals.revenue).toBe(
      (expected._sum.total ?? 0).toString() === '0'
        ? '0.00'
        : Number(expected._sum.total).toFixed(2),
    );
    expect(res.body.totals.orders).toBe(expected._count);

    const today = res.body.series[29] as { revenue: string; orders: number };
    expect(Number(today.revenue)).toBeGreaterThanOrEqual(12.34);
    expect(today.orders).toBeGreaterThanOrEqual(1);
  });

  it('acepta un rango válido y rechaza uno fuera de límites', async () => {
    const week = await http
      .get('/admin/sales/daily?days=7')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(week.body.series).toHaveLength(7);

    await http
      .get('/admin/sales/daily?days=3')
      .set('Cookie', adminCookie)
      .expect(400);
    await http
      .get('/admin/sales/daily?days=500')
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('solo el administrador puede consultarlo', async () => {
    await http.get('/admin/sales/daily').expect(401);
    await http.get('/admin/sales/daily').set('Cookie', clientCookie).expect(403);
  });
});
