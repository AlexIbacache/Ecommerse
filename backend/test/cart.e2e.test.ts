import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `cart${Date.now()}`;

let app: INestApplication;
let http: ReturnType<typeof request>;
let prisma: PrismaService;

let activeProduct: { id: number; price: string };
let outOfStockProduct: { id: number; price: string };
let inactiveProductId: number;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  http = request(await app.getUrl());
  prisma = app.get(PrismaService);

  const category = await prisma.category.findFirstOrThrow({
    where: { slug: 'audio' },
  });

  const active = await prisma.product.create({
    data: {
      name: `${runId} activo`,
      slug: `${runId}-activo`,
      description: 'Producto de prueba con stock disponible.',
      price: '10.00',
      stock: 5,
      isActive: true,
      categoryId: category.id,
    },
  });
  activeProduct = { id: active.id, price: active.price.toString() };

  const noStock = await prisma.product.create({
    data: {
      name: `${runId} sin stock`,
      slug: `${runId}-sin-stock`,
      description: 'Producto de prueba sin stock.',
      price: '5.00',
      stock: 0,
      isActive: true,
      categoryId: category.id,
    },
  });
  outOfStockProduct = { id: noStock.id, price: noStock.price.toString() };

  const inactive = await prisma.product.create({
    data: {
      name: `${runId} inactivo`,
      slug: `${runId}-inactivo`,
      description: 'Producto de prueba inactivo.',
      price: '10.00',
      stock: 5,
      isActive: false,
      categoryId: category.id,
    },
  });
  inactiveProductId = inactive.id;
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { slug: { startsWith: runId } } });
  await app.close();
});

describe('validación de carrito (e2e)', () => {
  it('acepta un carrito válido', async () => {
    const res = await http.post('/cart/validate').send({
      items: [
        {
          productId: activeProduct.id,
          quantity: 1,
          expectedPrice: activeProduct.price,
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.items[0]).toMatchObject({
      productId: activeProduct.id,
      priceChanged: false,
    });
    expect(res.body.items[0].issue).toBeUndefined();
  });

  it('detecta un cambio de precio', async () => {
    const res = await http.post('/cart/validate').send({
      items: [
        {
          productId: activeProduct.id,
          quantity: 1,
          expectedPrice: '1.00',
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.items[0].priceChanged).toBe(true);
    expect(res.body.items[0].price).toBe(activeProduct.price);
  });

  it('detecta stock insuficiente', async () => {
    const res = await http.post('/cart/validate').send({
      items: [
        {
          productId: outOfStockProduct.id,
          quantity: 1,
          expectedPrice: outOfStockProduct.price,
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.items[0].issue).toBe('INSUFFICIENT_STOCK');
  });

  it('detecta producto inactivo', async () => {
    const res = await http.post('/cart/validate').send({
      items: [{ productId: inactiveProductId, quantity: 1 }],
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.items[0].issue).toBe('INACTIVE');
  });

  it('detecta producto inexistente', async () => {
    const res = await http.post('/cart/validate').send({
      items: [{ productId: 999999, quantity: 1 }],
    });

    expect(res.status).toBe(200);
    expect(res.body.items[0].issue).toBe('NOT_FOUND');
  });

  it('rechaza carrito vacío o inválido con 400', async () => {
    const empty = await http.post('/cart/validate').send({ items: [] });
    const invalid = await http
      .post('/cart/validate')
      .send({ items: [{ productId: -1, quantity: 0 }] });

    expect(empty.status).toBe(400);
    expect(invalid.status).toBe(400);
  });
});
