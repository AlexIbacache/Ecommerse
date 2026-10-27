import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `e2e${Date.now()}`;
const email = `${runId}@test.local`;
const password = 'Password123!';

function cookieValue(setCookie: unknown, name: string): string {
  const list: string[] = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie as string]
      : [];
  const raw = list.find((c) => c.startsWith(`${name}=`));
  if (!raw) {
    throw new Error(`cookie ${name} no presente`);
  }
  return raw.split(';')[0];
}

let app: INestApplication;
let prisma: PrismaService;
let http: ReturnType<typeof request>;
let accessCookie: string;
let refreshCookie: string;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  prisma = app.get(PrismaService);
  http = request(await app.getUrl());

  await http
    .post('/auth/register')
    .send({ name: 'E2E User', email, password })
    .expect(201);

  const login = await http.post('/auth/login').send({ email, password }).expect(200);

  accessCookie = cookieValue(login.headers['set-cookie'], 'access_token');
  refreshCookie = cookieValue(login.headers['set-cookie'], 'refresh_token');
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
  await app.close();
});

describe('autenticación (e2e)', () => {
  it('entrega cookies httpOnly en el login', () => {
    expect(accessCookie).toContain('access_token=');
    expect(refreshCookie).toContain('refresh_token=');
  });

  it('protege /auth/me sin cookie y resuelve la sesión con cookie', async () => {
    const noCookie = await http.get('/auth/me');
    expect(noCookie.status).toBe(401);

    const me = await http.get('/auth/me').set('Cookie', accessCookie);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email, role: 'CLIENTE' });
  });

  it('rechaza email duplicado (409) y payload inválido (400)', async () => {
    const dup = await http.post('/auth/register').send({ name: 'Otro', email, password });
    expect(dup.status).toBe(409);

    const invalid = await http
      .post('/auth/register')
      .send({ name: 'A', email: 'no-es-email', password: '123' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.errors).toBeDefined();
  });

  it('rechaza credenciales inválidas con 401 genérico (mismo mensaje)', async () => {
    const wrong = await http.post('/auth/login').send({ email, password: 'WrongPass1!' });
    const unknown = await http
      .post('/auth/login')
      .send({ email: `nadie-${runId}@x.local`, password });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('aplica ownership: propio 200, ajeno 404', async () => {
    const me = await http.get('/auth/me').set('Cookie', accessCookie);
    const ownId = me.body.id;

    const own = await http.get(`/users/${ownId}`).set('Cookie', accessCookie);
    expect(own.status).toBe(200);

    const other = await http.get('/users/1').set('Cookie', accessCookie);
    expect(other.status).toBe(404);
  });

  it('rota el refresh token y revoca el anterior', async () => {
    const rotated = await http.post('/auth/refresh').set('Cookie', refreshCookie);
    expect(rotated.status).toBe(200);

    const newRefresh = cookieValue(rotated.headers['set-cookie'], 'refresh_token');
    expect(newRefresh).not.toBe(refreshCookie);

    const reuse = await http.post('/auth/refresh').set('Cookie', refreshCookie);
    expect(reuse.status).toBe(401);
  });

  it('cierra sesión con logout', async () => {
    const res = await http.post('/auth/logout').set('Cookie', accessCookie);
    expect(res.status).toBe(200);
  });
});

describe('rate limiting (e2e, instancia aislada)', () => {
  let rateApp: INestApplication;

  beforeAll(async () => {
    rateApp = await NestFactory.create(AppModule);
    await rateApp.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await rateApp.close();
  });

  it('rechaza con 429 tras superar el límite de login', async () => {
    const rateHttp = request(await rateApp.getUrl());
    const body = { email: 'rate@test.local', password: 'whatever' };
    let lastStatus = 0;

    for (let i = 0; i < 6; i++) {
      const res = await rateHttp.post('/auth/login').send(body);
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
