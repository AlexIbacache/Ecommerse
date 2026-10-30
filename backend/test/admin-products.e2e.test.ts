import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `admprod${Date.now()}`;

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
let categoryId: number;
let createdProductId: number;
let saleOrderId: number | null = null;

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

  const category = await prisma.category.findFirstOrThrow({
    where: { slug: 'audio' },
  });
  categoryId = category.id;
});

afterAll(async () => {
  if (saleOrderId) {
    await prisma.order.deleteMany({ where: { id: saleOrderId } });
  }
  await prisma.product.deleteMany({ where: { slug: { startsWith: runId } } });
  // Las acciones de admin dejan entradas en el registro de actividad: se limpian.
  await prisma.auditLog.deleteMany({
    where: { summary: { startsWith: runId } },
  });
  await app.close();
});

describe('admin de productos (e2e)', () => {
  it('crea un producto válido', async () => {
    const res = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({
        name: `${runId} Producto Test`,
        description: 'Descripción de producto de prueba para el panel admin.',
        price: 99.99,
        categoryId,
        stock: 5,
        images: ['https://picsum.photos/seed/admin-test/800/800'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      price: '99.99',
      stock: 5,
      isActive: true,
    });
    expect(res.body.images).toHaveLength(1);
    createdProductId = res.body.id;
  });

  it('rechaza datos inválidos con 400', async () => {
    const base = {
      name: `${runId} Inválido`,
      description: 'Descripción suficientemente larga para el test.',
      categoryId,
      images: ['https://picsum.photos/seed/x/800/800'],
    };

    const zeroPrice = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({ ...base, price: 0, stock: 1 });
    const noImages = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({ ...base, price: 10, stock: 1, images: [] });
    const badCategory = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({ ...base, price: 10, stock: 1, categoryId: 999999 });

    expect(zeroPrice.status).toBe(400);
    expect(noImages.status).toBe(400);
    expect(badCategory.status).toBe(400);
  });

  it('lista con búsqueda, filtro, orden y paginación incluyendo inactivos', async () => {
    await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({
        name: `${runId} Inactivo`,
        description: 'Producto inactivo de prueba para el panel admin.',
        price: 50,
        categoryId,
        stock: 0,
        isActive: false,
        images: ['https://picsum.photos/seed/admin-inactive/800/800'],
      })
      .expect(201);

    const search = await http
      .get('/admin/products')
      .set('Cookie', adminCookie)
      .query({ q: runId, pageSize: 50 });

    expect(search.status).toBe(200);
    expect(search.body.data.length).toBeGreaterThanOrEqual(2);
    expect(
      search.body.data.some((product: { isActive: boolean }) => product.isActive === false),
    ).toBe(true);

    const filtered = await http
      .get('/admin/products')
      .set('Cookie', adminCookie)
      .query({ category: 'audio', pageSize: 50 });
    for (const product of filtered.body.data) {
      expect(product.category.slug).toBe('audio');
    }

    const sorted = await http
      .get('/admin/products')
      .set('Cookie', adminCookie)
      .query({ sort: 'price_asc', pageSize: 50 });
    const prices = sorted.body.data.map((product: { price: string }) => Number(product.price));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const paginated = await http
      .get('/admin/products')
      .set('Cookie', adminCookie)
      .query({ page: 1, pageSize: 2 });
    expect(paginated.body.meta.pageSize).toBe(2);
    expect(paginated.body.data.length).toBeLessThanOrEqual(2);
  });

  it('edita un producto', async () => {
    const res = await http
      .patch(`/admin/products/${createdProductId}`)
      .set('Cookie', adminCookie)
      .send({ price: 123.45, stock: 3, isActive: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ price: '123.45', stock: 3, isActive: false });
  });

  it('elimina físicamente un producto sin ventas', async () => {
    const res = await http
      .delete(`/admin/products/${createdProductId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true, deactivated: false });

    const detail = await http
      .get(`/admin/products/${createdProductId}`)
      .set('Cookie', adminCookie);
    expect(detail.status).toBe(404);
  });

  it('desactiva un producto con ventas en lugar de borrarlo', async () => {
    const created = await http
      .post('/admin/products')
      .set('Cookie', adminCookie)
      .send({
        name: `${runId} Con Venta`,
        description: 'Producto con una venta asociada para probar el borrado seguro.',
        price: 20,
        categoryId,
        stock: 10,
        images: ['https://picsum.photos/seed/admin-sale/800/800'],
      })
      .expect(201);

    const client = await prisma.user.findFirstOrThrow({
      where: { email: 'cliente@demo.local' },
    });
    const order = await prisma.order.create({
      data: {
        userId: client.id,
        total: '20.00',
        items: {
          create: [
            { productId: created.body.id, quantity: 1, unitPrice: '20.00' },
          ],
        },
      },
    });
    saleOrderId = order.id;

    const res = await http
      .delete(`/admin/products/${created.body.id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: false, deactivated: true });

    const detail = await http
      .get(`/admin/products/${created.body.id}`)
      .set('Cookie', adminCookie);
    expect(detail.status).toBe(200);
    expect(detail.body.isActive).toBe(false);
  });

  it('rechaza a un cliente con 403 en todas las operaciones', async () => {
    const list = await http.get('/admin/products').set('Cookie', clientCookie);
    const create = await http
      .post('/admin/products')
      .set('Cookie', clientCookie)
      .send({});
    const update = await http
      .patch('/admin/products/1')
      .set('Cookie', clientCookie)
      .send({});
    const remove = await http
      .delete('/admin/products/1')
      .set('Cookie', clientCookie);

    expect(list.status).toBe(403);
    expect(create.status).toBe(403);
    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
  });
});
