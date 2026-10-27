import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `cat${Date.now()}`;

let app: INestApplication;
let http: ReturnType<typeof request>;
let prisma: PrismaService;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  http = request(await app.getUrl());
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { slug: { startsWith: runId } } });
  await app.close();
});

describe('catálogo público (e2e)', () => {
  it('lista las categorías del seed', async () => {
    const res = await http.get('/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { slug: string }) => c.slug === 'audio')).toBe(true);
  });

  it('devuelve el listado con metadata de paginación', async () => {
    const res = await http.get('/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 12 });
    expect(typeof res.body.meta.totalItems).toBe('number');
    expect(typeof res.body.meta.totalPages).toBe('number');
  });

  it('busca por nombre (parcial, insensible a mayúsculas)', async () => {
    const res = await http.get('/products').query({ q: 'AURICULARES' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const product of res.body.data) {
      expect(product.name.toLowerCase()).toContain('auriculares');
    }
  });

  it('filtra por categoría', async () => {
    const res = await http.get('/products').query({ category: 'audio' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const product of res.body.data) {
      expect(product.category.slug).toBe('audio');
    }
  });

  it('ordena por precio ascendente', async () => {
    const res = await http.get('/products').query({ sort: 'price_asc', pageSize: 48 });

    expect(res.status).toBe(200);
    const prices = res.body.data.map((p: { price: string }) => Number(p.price));
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it('pagina sin superponer resultados', async () => {
    const page1 = await http.get('/products').query({ page: 1, pageSize: 3, sort: 'price_asc' });
    const page2 = await http.get('/products').query({ page: 2, pageSize: 3, sort: 'price_asc' });

    expect(page1.body.meta.pageSize).toBe(3);
    expect(page1.body.data.length).toBe(3);

    const ids1 = page1.body.data.map((p: { id: number }) => p.id);
    const ids2 = page2.body.data.map((p: { id: number }) => p.id);
    expect(ids2.some((id: number) => ids1.includes(id))).toBe(false);
  });

  it('rechaza parámetros inválidos con 400', async () => {
    const tooBig = await http.get('/products').query({ pageSize: 999 });
    const badSort = await http.get('/products').query({ sort: 'precio' });

    expect(tooBig.status).toBe(400);
    expect(badSort.status).toBe(400);
  });

  it('devuelve el detalle por slug con imágenes y categoría', async () => {
    const res = await http.get('/products/auriculares-inalambricos-pro');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('auriculares-inalambricos-pro');
    expect(res.body.category.slug).toBe('audio');
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images.length).toBeGreaterThan(0);
    expect(typeof res.body.available).toBe('boolean');
  });

  it('devuelve 404 para un slug inexistente', async () => {
    const res = await http.get('/products/no-existe-catalogo');

    expect(res.status).toBe(404);
  });

  it('excluye productos inactivos del listado y del detalle', async () => {
    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'audio' } });

    const inactive = await prisma.product.create({
      data: {
        name: `${runId} Oculto`,
        slug: `${runId}-oculto`,
        description: 'Producto inactivo de prueba',
        price: '10.00',
        stock: 5,
        isActive: false,
        categoryId: category.id,
      },
    });

    const list = await http.get('/products').query({ q: 'Oculto' });
    expect(list.body.data.some((p: { id: number }) => p.id === inactive.id)).toBe(false);

    const detail = await http.get(`/products/${runId}-oculto`);
    expect(detail.status).toBe(404);
  });
});
