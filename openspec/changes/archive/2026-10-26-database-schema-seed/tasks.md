# Tasks

> Completado (2026-10-26): 9/9 tareas verificadas con Docker + PostgreSQL 16.
> Evidencia: `prisma validate` OK; migración `20261026062700_init` aplicada (9 tablas + constraints);
> insert con `stock = -1` rechazado por `Product_stock_non_negative`; seed ejecutado dos veces con
> conteos idénticos (2 roles, 2 usuarios, 3 categorías, 10 productos, 11 imágenes); tests de
> integridad 7/7 en verde (Vitest); `/health` responde 200 usando Prisma.

## 1. Configuración de Prisma

- [x] 1.1 Instalar e inicializar Prisma en `backend/` con datasource PostgreSQL leído desde `DATABASE_URL`; verificar que `npx prisma validate` pasa contra el servicio `db` levantado
- [x] 1.2 Configurar el cliente Prisma como provider inyectable en NestJS (PrismaService) y verificar conexión desde el endpoint `/health`

## 2. Esquema y migración inicial

- [x] 2.1 Modelar en `schema.prisma` las 9 entidades (roles, users, categories, products, product_images, comments, orders, order_items, payments) con FKs, UNIQUEs, CHECKs, enums de estado, tipos `NUMERIC(10,2)` e índices definidos en design.md; verificar con `npx prisma validate`
- [x] 2.2 Generar y aplicar la migración inicial; verificar con consulta SQL directa que existen las nueve tablas con sus constraints (por ejemplo intentando un insert con `stock` negativo y confirmando el rechazo)

## 3. Seed de datos de prueba

- [x] 3.1 Implementar `prisma/seed.ts` con upserts por clave natural: roles CLIENTE/ADMINISTRADOR, admin demo, cliente demo (contraseñas hasheadas), ≥2 categorías y ≥8 productos con imágenes URL y stock variado (incluye bajo stock y sin stock); verificar que los datos existen tras ejecutarlo
- [x] 3.2 Ejecutar el seed dos veces consecutivas y verificar que no se duplica ningún registro (idempotencia)
- [x] 3.3 Documentar en el README las credenciales demo (cliente y administrador) y verificar que corresponden a los usuarios creados por el seed

## 4. Pruebas de integridad del modelo

- [x] 4.1 Escribir tests de integración que verifiquen: email duplicado rechazado, stock negativo rechazado, precio cero/negativo rechazado, `paypal_order_id` duplicado rechazado y categoría con productos no eliminable; verificar que todos pasan
- [x] 4.2 Escribir test que verifique la exactitud monetaria (almacenar y recuperar `19.99` y `0.01` sin error) y el snapshot de precio (cambiar el precio de un producto no altera el `unit_price` de un ítem ya registrado); verificar que pasan
