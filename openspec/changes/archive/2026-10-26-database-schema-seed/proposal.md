# Proposal

## Why

Toda operación de negocio del e-commerce (catálogo, usuarios, comentarios, pedidos, pagos) debe persistir en una base de datos real ejecutada en Docker. El documento de requisitos exige entregar esquema, migraciones y datos de prueba; este change establece ese modelo de datos completo antes de construir cualquier funcionalidad encima.

## What Changes

- Definir el esquema Prisma con las 9 entidades del dominio: roles, users, categories, products, product_images, comments, orders, order_items, payments.
- Crear la migración inicial versionada con constraints de integridad (FK, UNIQUE, CHECK) y tipos monetarios exactos (`NUMERIC(10,2)`).
- Incorporar índices para las consultas principales (búsqueda de productos, comentarios por producto, pedidos por usuario, idempotencia de pagos).
- Crear script de seed idempotente: roles CLIENTE/ADMINISTRADOR, usuario admin demo, usuario cliente demo, categorías y productos con imágenes por URL y stock variado.

## Capabilities

### New Capabilities

- `data-model`: modelo de datos relacional del e-commerce con migraciones versionadas, garantías de integridad a nivel base de datos, precisión monetaria exacta, snapshot de precios en pedidos y datos de prueba reproducibles.

### Modified Capabilities

(sin cambios)

## Impact

- Código: nuevo directorio `backend/prisma/` (schema, migraciones, seed); cliente Prisma integrado al backend.
- Dependencias: `prisma`, `@prisma/client` en el backend; servicio `db` del change `setup-infra-foundation`.
- Sistemas: habilita `auth-and-rbac`, `catalog-api`, `comments`, `checkout-paypal`, `admin-*` y `customer-profile`.
