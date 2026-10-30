import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createCommentSchema } from '../src/comments/dto/create-comment.dto';
import { PrismaService } from '../src/database/prisma.service';

const runId = `rev${Date.now()}`;
const password = 'Password123!';

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
let productId: number;
let productSlug: string;
let adminCookie: string;
const cookies: Record<string, string> = {};
const emails = ['a', 'b', 'c', 'd'].map((key) => `${runId}${key}@test.local`);

async function signUp(key: string, email: string) {
  await http
    .post('/auth/register')
    .send({ name: `Reseñador ${key}`, email, password })
    .expect(201);
  const login = await http
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  cookies[key] = cookieHeader(login.headers['set-cookie'], 'access_token');
}

function summaryOf(productIdValue: number) {
  return http
    .get(`/products/${productIdValue}/comments?pageSize=20`)
    .expect(200)
    .then(
      (res) =>
        res.body.summary as {
          average: number | null;
          count: number;
          distribution: number[];
        },
    );
}

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  http = request(await app.getUrl());
  prisma = app.get(PrismaService);

  const category = await prisma.category.findFirstOrThrow({
    where: { slug: 'audio' },
  });
  const product = await prisma.product.create({
    data: {
      slug: `${runId}-producto`,
      name: `${runId} Producto`,
      description: 'Producto de prueba para reseñas.',
      price: '10.00',
      stock: 5,
      categoryId: category.id,
    },
  });
  productId = product.id;
  productSlug = product.slug;

  for (const [index, key] of ['a', 'b', 'c', 'd'].entries()) {
    await signUp(key, emails[index]);
  }

  const admin = await http
    .post('/auth/login')
    .send({ email: 'admin@demo.local', password: 'Admin123!' })
    .expect(200);
  adminCookie = cookieHeader(admin.headers['set-cookie'], 'access_token');
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { slug: { startsWith: runId } } });
  await prisma.auditLog.deleteMany({
    where: { summary: { startsWith: runId } },
  });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await app.close();
});

describe('reglas antispam (esquema)', () => {
  const base = { content: 'Un comentario normal del producto' };

  it('acepta un comentario normal y hasta 1 enlace', () => {
    expect(createCommentSchema.safeParse(base).success).toBe(true);
    expect(
      createCommentSchema.safeParse({
        content: 'Mira la reseña en https://ejemplo.com/resena',
      }).success,
    ).toBe(true);
  });

  it('rechaza 2 o más enlaces', () => {
    const result = createCommentSchema.safeParse({
      content: 'Visita https://a.com y también www.b.com ahora',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un carácter repetido en exceso', () => {
    expect(
      createCommentSchema.safeParse({ content: 'Genial aaaaaaaaaaaaaaaaaaaa' })
        .success,
    ).toBe(false);
    expect(
      createCommentSchema.safeParse({ content: 'Excelente!!!!!!!!!!!!!!!!!!' })
        .success,
    ).toBe(false);
    // Repetición moderada sí es válida.
    expect(
      createCommentSchema.safeParse({ content: 'Muuuuy bueno, sí señor' })
        .success,
    ).toBe(true);
  });

  it('solo acepta puntuaciones enteras de 1 a 5', () => {
    for (const rating of [0, 6, 3.5, -1, '5' as unknown as number]) {
      expect(createCommentSchema.safeParse({ ...base, rating }).success).toBe(
        false,
      );
    }
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(createCommentSchema.safeParse({ ...base, rating }).success).toBe(
        true,
      );
    }
  });
});

describe('antispam y reseñas (e2e)', () => {
  it('descarta en silencio lo que rellena el campo trampa', async () => {
    const res = await http
      .post(`/products/${productId}/comments`)
      .send({
        content: `${runId} comprá ya`,
        guestName: 'Bot',
        website: 'http://spam.example',
      })
      .expect(201);

    expect(res.body.id).toBe(0);
    expect(await prisma.comment.count({ where: { productId } })).toBe(0);
  });

  it('rechaza un comentario repetido en el mismo producto (sin distinguir mayúsculas)', async () => {
    const content = `${runId} Muy buen producto, lo recomiendo`;

    await http
      .post(`/products/${productId}/comments`)
      .send({ content, guestName: 'Visitante' })
      .expect(201);

    const repeated = await http
      .post(`/products/${productId}/comments`)
      .send({ content: content.toUpperCase(), guestName: 'Otro visitante' })
      .expect(409);
    expect(repeated.body.message).toMatch(/igual/i);
  });

  it('no deja puntuar a visitantes anónimos', async () => {
    const res = await http
      .post(`/products/${productId}/comments`)
      .send({
        content: `${runId} quiero puntuar sin cuenta`,
        guestName: 'Visitante',
        rating: 5,
      })
      .expect(400);
    expect(res.body.message).toMatch(/sesión/i);
  });

  it('calcula promedio, cantidad y distribución con las reseñas visibles', async () => {
    const ratings: [string, number][] = [
      ['a', 5],
      ['b', 4],
      ['c', 2],
    ];
    const ids: Record<string, number> = {};

    for (const [key, rating] of ratings) {
      const res = await http
        .post(`/products/${productId}/comments`)
        .set('Cookie', cookies[key])
        .send({ content: `${runId} reseña de ${key}`, rating })
        .expect(201);
      expect(res.body.rating).toBe(rating);
      ids[key] = res.body.id;
    }

    const summary = await summaryOf(productId);
    expect(summary.count).toBe(3);
    expect(summary.average).toBe(3.7);
    expect(summary.distribution).toEqual([0, 1, 0, 1, 1]);

    const detail = await http.get(`/products/${productSlug}`).expect(200);
    expect(detail.body.rating).toEqual({ average: 3.7, count: 3 });

    const list = await http.get(`/products?q=${runId}`).expect(200);
    const listed = list.body.data.find(
      (item: { id: number }) => item.id === productId,
    );
    expect(listed.rating).toEqual({ average: 3.7, count: 3 });

    // Un comentario oculto por el admin deja de contar en el promedio.
    await http
      .patch(`/admin/comments/${ids.c}`)
      .set('Cookie', adminCookie)
      .send({ status: 'OCULTO' })
      .expect(200);

    const afterHide = await summaryOf(productId);
    expect(afterHide.count).toBe(2);
    expect(afterHide.average).toBe(4.5);
    expect(afterHide.distribution).toEqual([0, 0, 0, 1, 1]);

    // Ocultar la reseña no devuelve el derecho a puntuar de nuevo.
    await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', cookies.c)
      .send({ content: `${runId} otra reseña de c`, rating: 5 })
      .expect(409);
  });

  it('con envíos simultáneos solo se guarda una puntuación por usuario', async () => {
    const send = (suffix: string) =>
      http
        .post(`/products/${productId}/comments`)
        .set('Cookie', cookies.d)
        .send({ content: `${runId} simultáneo ${suffix}`, rating: 3 });

    const [first, second] = await Promise.all([send('uno'), send('dos')]);
    expect([first.status, second.status].sort()).toEqual([201, 409]);

    const stored = await prisma.comment.count({
      where: { productId, user: { email: emails[3] }, rating: { not: null } },
    });
    expect(stored).toBe(1);
  });
});

describe('sin puntuaciones', () => {
  it('devuelve promedio nulo y distribución en cero', async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { slug: 'audio' },
    });
    const empty = await prisma.product.create({
      data: {
        slug: `${runId}-vacio`,
        name: `${runId} Vacío`,
        description: 'Producto sin reseñas.',
        price: '10.00',
        stock: 5,
        categoryId: category.id,
      },
    });

    const summary = await summaryOf(empty.id);
    expect(summary).toEqual({
      average: null,
      count: 0,
      distribution: [0, 0, 0, 0, 0],
    });

    const detail = await http.get(`/products/${empty.slug}`).expect(200);
    expect(detail.body.rating).toEqual({ average: null, count: 0 });
  });
});
