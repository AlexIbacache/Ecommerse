import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const runId = `prof${Date.now()}`;
const email1 = `${runId}@test.local`;
const email2 = `${runId}-other@test.local`;

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
let cookie: string;

beforeAll(async () => {
  app = await NestFactory.create(AppModule);
  await app.listen(0, '127.0.0.1');
  http = request(await app.getUrl());
  prisma = app.get(PrismaService);

  await http
    .post('/auth/register')
    .send({ name: 'Perfil Test', email: email1, password: 'Password123!' })
    .expect(201);
  const login = await http
    .post('/auth/login')
    .send({ email: email1, password: 'Password123!' })
    .expect(200);
  cookie = cookieHeader(login.headers['set-cookie'], 'access_token');

  await http
    .post('/auth/register')
    .send({ name: 'Otro', email: email2, password: 'Password123!' })
    .expect(201);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
  await app.close();
});

describe('perfil del cliente (e2e)', () => {
  it('devuelve el perfil propio', async () => {
    const res = await http.get('/users/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: email1,
      name: 'Perfil Test',
      role: 'CLIENTE',
    });
  });

  it('requiere autenticación', async () => {
    const res = await http.get('/users/me');
    expect(res.status).toBe(401);
  });

  it('actualiza el nombre', async () => {
    const res = await http
      .patch('/users/me')
      .set('Cookie', cookie)
      .send({ name: 'Nombre Nuevo' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nombre Nuevo');
  });

  it('actualiza el email', async () => {
    const res = await http
      .patch('/users/me')
      .set('Cookie', cookie)
      .send({ email: `${runId}-nuevo@test.local` });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(`${runId}-nuevo@test.local`);
  });

  it('rechaza un email en uso con 409', async () => {
    const res = await http
      .patch('/users/me')
      .set('Cookie', cookie)
      .send({ email: email2 });

    expect(res.status).toBe(409);
  });

  it('ignora intentos de cambiar el rol', async () => {
    const res = await http
      .patch('/users/me')
      .set('Cookie', cookie)
      .send({ name: 'Con Rol', role: 'ADMINISTRADOR' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('CLIENTE');
  });

  it('valida datos inválidos con 400', async () => {
    const badEmail = await http
      .patch('/users/me')
      .set('Cookie', cookie)
      .send({ email: 'no-es-email' });
    const empty = await http.patch('/users/me').set('Cookie', cookie).send({});

    expect(badEmail.status).toBe(400);
    expect(empty.status).toBe(400);
  });
});
