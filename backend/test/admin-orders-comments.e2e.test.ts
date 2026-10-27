import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `adm12${Date.now()}`;

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
let productId: number;
let commentId: number;
let orderId: number;

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

  const product = await prisma.product.findFirstOrThrow({
    where: { slug: 'auriculares-inalambricos-pro' },
  });
  productId = product.id;

  const client = await prisma.user.findFirstOrThrow({
    where: { email: 'cliente@demo.local' },
  });

  const order = await prisma.order.create({
    data: {
      userId: client.id,
      total: '129.99',
      status: 'PAGADO',
      items: {
        create: [{ productId, quantity: 1, unitPrice: '129.99' }],
      },
      payment: {
        create: {
          status: 'COMPLETADA',
          amount: '129.99',
          paypalOrderId: `ADM-${runId}`,
          paypalCaptureId: `CAP-${runId}`,
        },
      },
    },
  });
  orderId = order.id;
});

afterAll(async () => {
  await prisma.comment.deleteMany({
    where: { content: { startsWith: runId } },
  });
  await prisma.payment.deleteMany({ where: { orderId } });
  await prisma.order.deleteMany({ where: { id: orderId } });
  await app.close();
});

describe('moderación de comentarios (e2e)', () => {
  it('permite ocultar, mostrar y eliminar un comentario', async () => {
    const created = await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', clientCookie)
      .send({ content: `${runId} comentario para moderar` })
      .expect(201);
    commentId = created.body.id;

    const adminList = await http
      .get('/admin/comments')
      .set('Cookie', adminCookie)
      .query({ pageSize: 50 });
    expect(
      adminList.body.data.some((comment: { id: number }) => comment.id === commentId),
    ).toBe(true);

    const hidden = await http
      .patch(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie)
      .send({ status: 'OCULTO' });
    expect(hidden.status).toBe(200);

    const publicAfterHide = await http
      .get(`/products/${productId}/comments`)
      .query({ pageSize: 20 });
    expect(
      publicAfterHide.body.data.some(
        (comment: { id: number }) => comment.id === commentId,
      ),
    ).toBe(false);

    await http
      .patch(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie)
      .send({ status: 'VISIBLE' })
      .expect(200);

    const publicAfterShow = await http
      .get(`/products/${productId}/comments`)
      .query({ pageSize: 20 });
    expect(
      publicAfterShow.body.data.some(
        (comment: { id: number }) => comment.id === commentId,
      ),
    ).toBe(true);

    const removed = await http
      .delete(`/admin/comments/${commentId}`)
      .set('Cookie', adminCookie);
    expect(removed.status).toBe(200);

    const publicAfterDelete = await http
      .get(`/products/${productId}/comments`)
      .query({ pageSize: 20 });
    expect(
      publicAfterDelete.body.data.some(
        (comment: { id: number }) => comment.id === commentId,
      ),
    ).toBe(false);
  });
});

describe('administración de ventas (e2e)', () => {
  it('lista ventas con cliente, estados y total', async () => {
    const res = await http
      .get('/admin/orders')
      .set('Cookie', adminCookie)
      .query({ pageSize: 50 });

    expect(res.status).toBe(200);
    const order = res.body.data.find((item: { id: number }) => item.id === orderId);
    expect(order).toBeDefined();
    expect(order).toMatchObject({
      customerEmail: 'cliente@demo.local',
      status: 'PAGADO',
      paymentStatus: 'COMPLETADA',
      total: '129.99',
    });
  });

  it('devuelve el detalle de la venta con ítems y transacción PayPal', async () => {
    const res = await http.get(`/admin/orders/${orderId}`).set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      name: 'Auriculares Inalámbricos Pro',
      quantity: 1,
      unitPrice: '129.99',
    });
    expect(res.body.customer.email).toBe('cliente@demo.local');
    expect(res.body.payment).toMatchObject({
      status: 'COMPLETADA',
      paypalOrderId: `ADM-${runId}`,
    });
  });

  it('devuelve 404 para un pedido inexistente', async () => {
    const res = await http.get('/admin/orders/999999').set('Cookie', adminCookie);
    expect(res.status).toBe(404);
  });

  it('rechaza a un cliente con 403 en todas las operaciones', async () => {
    const ordersList = await http.get('/admin/orders').set('Cookie', clientCookie);
    const orderDetail = await http
      .get(`/admin/orders/${orderId}`)
      .set('Cookie', clientCookie);
    const commentsList = await http.get('/admin/comments').set('Cookie', clientCookie);
    const patch = await http
      .patch('/admin/comments/1')
      .set('Cookie', clientCookie)
      .send({ status: 'OCULTO' });
    const remove = await http.delete('/admin/comments/1').set('Cookie', clientCookie);

    expect(ordersList.status).toBe(403);
    expect(orderDetail.status).toBe(403);
    expect(commentsList.status).toBe(403);
    expect(patch.status).toBe(403);
    expect(remove.status).toBe(403);
  });
});
