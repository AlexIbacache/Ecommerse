import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `com${Date.now()}`;
const userEmail = `${runId}@test.local`;
const userPassword = 'Password123!';

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
let accessCookie: string;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  http = request(await app.getUrl());
  prisma = app.get(PrismaService);

  const product = await prisma.product.findFirstOrThrow({
    where: { slug: 'auriculares-inalambricos-pro' },
  });
  productId = product.id;

  await http
    .post('/auth/register')
    .send({ name: 'Comentarista Test', email: userEmail, password: userPassword })
    .expect(201);

  const login = await http
    .post('/auth/login')
    .send({ email: userEmail, password: userPassword })
    .expect(200);

  accessCookie = cookieHeader(login.headers['set-cookie'], 'access_token');
});

afterAll(async () => {
  await prisma.comment.deleteMany({ where: { content: { startsWith: runId } } });
  await prisma.user.deleteMany({ where: { email: userEmail } });
  await app.close();
});

describe('comentarios (e2e)', () => {
  it('permite comentar como usuario registrado', async () => {
    const res = await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', accessCookie)
      .send({ content: `${runId} comentario registrado` });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      authorName: 'Comentarista Test',
      isAnonymous: false,
      content: `${runId} comentario registrado`,
    });
  });

  it('permite comentar como visitante anónimo', async () => {
    const res = await http
      .post(`/products/${productId}/comments`)
      .send({ content: `${runId} comentario anónimo`, guestName: 'Visitante' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ authorName: 'Visitante', isAnonymous: true });
  });

  it('rechaza comentario anónimo sin nombre', async () => {
    const res = await http
      .post(`/products/${productId}/comments`)
      .send({ content: `${runId} sin nombre` });

    expect(res.status).toBe(400);
  });

  it('valida el contenido (muy corto)', async () => {
    const res = await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', accessCookie)
      .send({ content: 'x' });

    expect(res.status).toBe(400);
  });

  it('almacena contenido malicioso como texto inerte', async () => {
    const malicious = `${runId} <script>alert('xss')</script>`;
    await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', accessCookie)
      .send({ content: malicious })
      .expect(201);

    const list = await http
      .get(`/products/${productId}/comments`)
      .query({ pageSize: 20 });

    const found = list.body.data.find(
      (comment: { content: string }) => comment.content === malicious,
    );
    expect(found).toBeDefined();
  });

  it('excluye comentarios ocultos del listado público', async () => {
    const created = await http
      .post(`/products/${productId}/comments`)
      .set('Cookie', accessCookie)
      .send({ content: `${runId} oculto` })
      .expect(201);

    await prisma.comment.update({
      where: { id: created.body.id },
      data: { status: 'OCULTO' },
    });

    const list = await http
      .get(`/products/${productId}/comments`)
      .query({ pageSize: 20 });

    const found = list.body.data.find(
      (comment: { content: string }) => comment.content === `${runId} oculto`,
    );
    expect(found).toBeUndefined();
  });

  it('pagina el listado de comentarios', async () => {
    const list = await http
      .get(`/products/${productId}/comments`)
      .query({ page: 1, pageSize: 2 });

    expect(list.status).toBe(200);
    expect(list.body.meta.pageSize).toBe(2);
    expect(list.body.data.length).toBeLessThanOrEqual(2);
  });
});

describe('rate limiting de comentarios (instancia aislada)', () => {
  const rateId = `comrate${Date.now()}`;
  const rateEmail = `${rateId}@test.local`;
  let rateApp: INestApplication;
  let rateHttp: ReturnType<typeof request>;
  let ratePrisma: PrismaService;
  let rateProductId: number;

  beforeAll(async () => {
    rateApp = await NestFactory.create(AppModule);
    await rateApp.listen(0, '127.0.0.1');
    rateHttp = request(await rateApp.getUrl());
    ratePrisma = rateApp.get(PrismaService);

    const product = await ratePrisma.product.findFirstOrThrow({
      where: { slug: 'auriculares-inalambricos-pro' },
    });
    rateProductId = product.id;

    await rateHttp
      .post('/auth/register')
      .send({ name: 'Rate Test', email: rateEmail, password: userPassword })
      .expect(201);
    await rateHttp
      .post('/auth/login')
      .send({ email: rateEmail, password: userPassword })
      .expect(200);
  });

  afterAll(async () => {
    await ratePrisma.comment.deleteMany({
      where: { content: { startsWith: rateId } },
    });
    await ratePrisma.user.deleteMany({ where: { email: rateEmail } });
    await rateApp.close();
  });

  it('rechaza con 429 tras superar el límite por usuario', async () => {
    const login = await rateHttp
      .post('/auth/login')
      .send({ email: rateEmail, password: userPassword });
    const cookie = cookieHeader(login.headers['set-cookie'], 'access_token');

    let lastStatus = 0;

    for (let i = 0; i < 6; i++) {
      const res = await rateHttp
        .post(`/products/${rateProductId}/comments`)
        .set('Cookie', cookie)
        .send({ content: `${rateId} comentario ${i}` });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
