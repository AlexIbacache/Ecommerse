import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { startPaypalMock, type PaypalMockServer } from './paypal-mock';

const base = `chk${Date.now()}`;

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

function setPaypalEnv(url: string) {
  process.env.PAYPAL_API_BASE = url;
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';
  process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
}

async function registerAndLogin(
  http: ReturnType<typeof request>,
  email: string,
): Promise<string> {
  await http
    .post('/auth/register')
    .send({ name: 'Checkout Test', email, password: 'Password123!' })
    .expect(201);
  const login = await http
    .post('/auth/login')
    .send({ email, password: 'Password123!' })
    .expect(200);
  return cookieHeader(login.headers['set-cookie'], 'access_token');
}

async function createTestProduct(
  prisma: PrismaService,
  prefix: string,
  price: string,
  stock: number,
) {
  const category = await prisma.category.findFirstOrThrow({
    where: { slug: 'audio' },
  });

  return prisma.product.create({
    data: {
      name: `${prefix} producto`,
      slug: `${prefix}-producto`,
      description: 'Producto de prueba de checkout',
      price,
      stock,
      isActive: true,
      categoryId: category.id,
    },
  });
}

async function cleanup(prisma: PrismaService, prefix: string) {
  await prisma.payment.deleteMany({
    where: { order: { user: { email: { startsWith: prefix } } } },
  });
  await prisma.order.deleteMany({
    where: { user: { email: { startsWith: prefix } } },
  });
  await prisma.product.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
}

describe('checkout: flujo feliz', () => {
  const prefix = `${base}-happy`;
  let mock: PaypalMockServer;
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaService;
  let cookie: string;
  let product: { id: number; price: string };

  beforeAll(async () => {
    mock = await startPaypalMock({});
    setPaypalEnv(mock.url);
    app = await NestFactory.create(AppModule);
    await app.listen(0, '127.0.0.1');
    http = request(await app.getUrl());
    prisma = app.get(PrismaService);

    const created = await createTestProduct(prisma, prefix, '129.99', 50);
    product = { id: created.id, price: created.price.toString() };
    cookie = await registerAndLogin(http, `${prefix}@test.local`);
  });

  afterAll(async () => {
    await cleanup(prisma, prefix);
    await app.close();
    await mock.close();
  });

  let orderId: number;

  it('crea el pedido recalculando totales (ignora importes del cliente)', async () => {
    const res = await http
      .post('/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: product.id, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDIENTE_PAGO');
    expect(res.body.items[0].unitPrice).toBe(product.price);
    expect(res.body.total).toBe((Number(product.price) * 2).toFixed(2));
    orderId = res.body.id;
  });

  it('rechaza con 409 si el stock es insuficiente', async () => {
    const res = await http
      .post('/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: product.id, quantity: 100 }] });

    expect(res.status).toBe(409);
  });

  it('inicia la orden de pago en PayPal', async () => {
    const res = await http.post(`/orders/${orderId}/paypal`).set('Cookie', cookie);

    expect(res.status).toBe(201);
    expect(res.body.paypalOrderId).toMatch(/^PAYPAL-ORDER-/);
  });

  it('captura, verifica y descuenta stock', async () => {
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId } });
    const before = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
      .stock;

    const res = await http
      .post('/payments/capture')
      .set('Cookie', cookie)
      .send({ paypalOrderId: payment.paypalOrderId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PAGADO');

    const after = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
      .stock;
    expect(after).toBe(before - 2);
  });

  it('es idempotente ante captura duplicada (sin doble descuento)', async () => {
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId } });
    const before = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
      .stock;

    const res = await http
      .post('/payments/capture')
      .set('Cookie', cookie)
      .send({ paypalOrderId: payment.paypalOrderId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PAGADO');

    const after = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
      .stock;
    expect(after).toBe(before);
  });

  it('protege el detalle de pedidos ajenos (404)', async () => {
    const otherCookie = await registerAndLogin(http, `${prefix}-other@test.local`);
    const res = await http.get(`/orders/${orderId}`).set('Cookie', otherCookie);
    expect(res.status).toBe(404);
  });

  it('cancela un pedido pendiente', async () => {
    const create = await http
      .post('/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    const res = await http
      .post(`/orders/${create.body.id}/cancel`)
      .set('Cookie', cookie);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('CANCELADO');
  });

  it('no expone un endpoint para cambiar el estado manualmente', async () => {
    const res = await http
      .patch(`/orders/${orderId}`)
      .set('Cookie', cookie)
      .send({ status: 'PAGADO' });

    expect(res.status).toBe(404);
  });
});

describe('checkout: importe inconsistente', () => {
  const prefix = `${base}-mm`;
  let mock: PaypalMockServer;
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaService;
  let cookie: string;
  let product: { id: number };

  beforeAll(async () => {
    mock = await startPaypalMock({ amountOverride: '1.00' });
    setPaypalEnv(mock.url);
    app = await NestFactory.create(AppModule);
    await app.listen(0, '127.0.0.1');
    http = request(await app.getUrl());
    prisma = app.get(PrismaService);

    const created = await createTestProduct(prisma, prefix, '10.00', 5);
    product = { id: created.id };
    cookie = await registerAndLogin(http, `${prefix}@test.local`);
  });

  afterAll(async () => {
    await cleanup(prisma, prefix);
    await app.close();
    await mock.close();
  });

  it('no marca pagado y registra PAGO_FALLIDO', async () => {
    const order = await http
      .post('/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: product.id, quantity: 1 }] })
      .expect(201);

    await http.post(`/orders/${order.body.id}/paypal`).set('Cookie', cookie).expect(201);

    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.body.id },
    });

    const res = await http
      .post('/payments/capture')
      .set('Cookie', cookie)
      .send({ paypalOrderId: payment.paypalOrderId });

    expect(res.status).toBe(502);

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id: order.body.id },
    });
    expect(updated.status).toBe('PAGO_FALLIDO');
  });
});

describe('checkout: concurrencia sobre el último ítem', () => {
  const prefix = `${base}-cc`;
  let mock: PaypalMockServer;
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    mock = await startPaypalMock({});
    setPaypalEnv(mock.url);
    app = await NestFactory.create(AppModule);
    await app.listen(0, '127.0.0.1');
    http = request(await app.getUrl());
    prisma = app.get(PrismaService);
    cookie = await registerAndLogin(http, `${prefix}@test.local`);
  });

  afterAll(async () => {
    await cleanup(prisma, prefix);
    await app.close();
    await mock.close();
  });

  it('solo una compra descuenta el stock; la otra queda PAGO_FALLIDO', async () => {
    const product = await createTestProduct(prisma, prefix, '10.00', 1);

    const order1 = await http
      .post('/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: product.id, quantity: 1 }] })
      .expect(201);
    const order2 = await http
      .post('/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: product.id, quantity: 1 }] })
      .expect(201);

    const pp1 = await http
      .post(`/orders/${order1.body.id}/paypal`)
      .set('Cookie', cookie)
      .expect(201);
    const pp2 = await http
      .post(`/orders/${order2.body.id}/paypal`)
      .set('Cookie', cookie)
      .expect(201);

    const [cap1, cap2] = await Promise.all([
      http
        .post('/payments/capture')
        .set('Cookie', cookie)
        .send({ paypalOrderId: pp1.body.paypalOrderId }),
      http
        .post('/payments/capture')
        .set('Cookie', cookie)
        .send({ paypalOrderId: pp2.body.paypalOrderId }),
    ]);

    expect([cap1.status, cap2.status].sort()).toEqual([201, 409]);

    const orderA = await prisma.order.findUniqueOrThrow({
      where: { id: order1.body.id },
    });
    const orderB = await prisma.order.findUniqueOrThrow({
      where: { id: order2.body.id },
    });
    expect([orderA.status, orderB.status].sort()).toEqual(['PAGADO', 'PAGO_FALLIDO']);

    const updated = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(updated.stock).toBe(0);
  });
});

describe('checkout: reconciliación de pagos pendientes', () => {
  it('resuelve un pago aprobado al consultar el pedido', async () => {
    const prefix = `${base}-rc1`;
    const mock = await startPaypalMock({ orderStatus: 'APPROVED' });
    setPaypalEnv(mock.url);
    const app = await NestFactory.create(AppModule);
    await app.listen(0, '127.0.0.1');
    const http = request(await app.getUrl());
    const prisma = app.get(PrismaService);

    try {
      const product = await createTestProduct(prisma, prefix, '10.00', 5);
      const cookie = await registerAndLogin(http, `${prefix}@test.local`);

      const order = await http
        .post('/orders')
        .set('Cookie', cookie)
        .send({ items: [{ productId: product.id, quantity: 1 }] })
        .expect(201);

      await http.post(`/orders/${order.body.id}/paypal`).set('Cookie', cookie).expect(201);

      const res = await http.get(`/orders/${order.body.id}`).set('Cookie', cookie);
      expect(res.body.status).toBe('PAGADO');
    } finally {
      await cleanup(prisma, prefix);
      await app.close();
      await mock.close();
    }
  });

  it('resuelve un pago ya capturado en PayPal al consultar', async () => {
    const prefix = `${base}-rc2`;
    const mock = await startPaypalMock({ orderStatus: 'COMPLETED' });
    setPaypalEnv(mock.url);
    const app = await NestFactory.create(AppModule);
    await app.listen(0, '127.0.0.1');
    const http = request(await app.getUrl());
    const prisma = app.get(PrismaService);

    try {
      const product = await createTestProduct(prisma, prefix, '10.00', 5);
      const cookie = await registerAndLogin(http, `${prefix}@test.local`);

      const order = await http
        .post('/orders')
        .set('Cookie', cookie)
        .send({ items: [{ productId: product.id, quantity: 1 }] })
        .expect(201);

      await http.post(`/orders/${order.body.id}/paypal`).set('Cookie', cookie).expect(201);

      const res = await http.get(`/orders/${order.body.id}`).set('Cookie', cookie);
      expect(res.body.status).toBe('PAGADO');
    } finally {
      await cleanup(prisma, prefix);
      await app.close();
      await mock.close();
    }
  });
});

describe('checkout: error de comunicación con PayPal', () => {
  it('mantiene el pedido pendiente y responde 502', async () => {
    const prefix = `${base}-err`;
    const mock = await startPaypalMock({ failRequests: true });
    setPaypalEnv(mock.url);
    const app = await NestFactory.create(AppModule);
    await app.listen(0, '127.0.0.1');
    const http = request(await app.getUrl());
    const prisma = app.get(PrismaService);

    try {
      const product = await createTestProduct(prisma, prefix, '10.00', 5);
      const cookie = await registerAndLogin(http, `${prefix}@test.local`);

      const order = await http
        .post('/orders')
        .set('Cookie', cookie)
        .send({ items: [{ productId: product.id, quantity: 1 }] })
        .expect(201);

      const res = await http
        .post(`/orders/${order.body.id}/paypal`)
        .set('Cookie', cookie);

      expect(res.status).toBe(502);

      const updated = await prisma.order.findUniqueOrThrow({
        where: { id: order.body.id },
      });
      expect(updated.status).toBe('PENDIENTE_PAGO');
    } finally {
      await cleanup(prisma, prefix);
      await app.close();
      await mock.close();
    }
  });
});
