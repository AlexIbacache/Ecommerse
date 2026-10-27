# Terral — E-commerce Full Stack

Aplicación de e-commerce completa con tienda pública, cuentas de cliente, comentarios, carrito, checkout con **PayPal Sandbox** y panel administrativo.

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui sobre Radix UI, Zustand, Motion, Sonner (toasts), Zod.
- **Backend:** NestJS 11 + TypeScript, API REST, Zod, JWT (`jose`), argon2id, Prisma.
- **Base de datos:** PostgreSQL 16 en Docker (volumen persistente).
- **Infraestructura:** Docker + Docker Compose (servicios `frontend`, `backend`, `db`).
- **Pagos:** PayPal Orders API v2, **solo entorno Sandbox**.

## Arquitectura

```
+-------------+   HTTP/JSON   +-------------+   Prisma   +--------------+
|  frontend   | ------------> |   backend   | ---------> |  PostgreSQL  |
|  Next.js    |  cookies      |  NestJS     |            |  (volumen    |
|  :3000      | <------------ |  :4000      | <--------- |   pgdata)    |
+------+------+               +------+------+            +--------------+
       |                             |
       | PayPal JS SDK               | Orders API v2 (server-to-server)
       v                             v
       +--------> PayPal Sandbox <---+
```

- El backend es la única fuente de verdad: los importes se recalculan desde la base de datos y los pagos se verifican server-side contra PayPal.
- El stock se descuenta de forma atómica recién al confirmarse el pago.
- La idempotencia de pagos se garantiza con `paypal_order_id` único.

## Requisitos

- Docker Desktop con Docker Compose v2 (en Windows requiere WSL2).

## Inicio rápido

```bash
cp .env.example .env
docker compose up --build
```

Al iniciar, el backend aplica las migraciones y ejecuta el seed (idempotente) automáticamente. No hace falta ningún paso manual de base de datos.

| Servicio | URL |
|---|---|
| Tienda | http://localhost:3000 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |
| PostgreSQL | localhost:5432 |

### Credenciales de demostración

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@demo.local` | `Admin123!` |
| Cliente | `cliente@demo.local` | `Cliente123!` |

## Pagos con PayPal Sandbox

El flujo de pago requiere credenciales Sandbox propias. Ver la guía paso a paso en **[docs/paypal-sandbox.md](docs/paypal-sandbox.md)**.

Resumen: en el [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) creá una app Sandbox y copiá `Client ID` y `Secret` a `.env`:

```bash
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...   # el mismo Client ID (es público)
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

## Comandos útiles

```bash
docker compose up -d                # levantar en segundo plano
docker compose logs -f backend      # logs del backend
docker compose down                 # detener (conserva datos)
docker compose down -v              # detener y borrar volúmenes (base limpia)

docker compose exec backend npm run db:seed     # volver a cargar datos de prueba
docker compose exec backend npm test            # tests del backend (Jest)
docker compose exec frontend npm test           # tests del frontend (Vitest)
docker compose exec frontend npm run build      # build de producción del frontend
```

> `next build` no debe ejecutarse mientras el dev server está activo. Para validar el build:
> `docker compose stop frontend && docker compose run --rm --no-deps frontend npm run build && docker compose up -d frontend`.

## Estructura del proyecto

```
.
├── docker-compose.yml
├── .env.example
├── backend/                 # NestJS + Prisma
│   ├── prisma/              # schema, migraciones y seed
│   ├── src/                 # auth, users, products, categories, cart,
│   │                        # comments, orders, payments, admin
│   └── test/                # unit + e2e (Jest)
├── frontend/                # Next.js App Router
│   └── src/
│       ├── app/             # tienda, auth, cuenta, checkout, admin
│       ├── components/      # ui (shadcn), storefront, header/footer
│       ├── lib/             # api client, catálogo, schemas, utils
│       └── stores/          # Zustand (auth, carrito)
├── docs/                    # guía de PayPal Sandbox
└── openspec/                # planificación y control de changes
```

## Seguridad implementada

- Contraseñas con **argon2id**; nunca se almacenan en texto plano.
- JWT de acceso corto en cookie **httpOnly** + refresh token rotativo persistido (hash).
- Autorización por rol y por propietario verificada en el backend (un recurso ajeno responde 404).
- Validación de entradas con Zod en todos los endpoints; errores sin stack traces.
- **CORS estricto** (solo el origen configurado), **helmet** (headers de seguridad) y **rate limiting**.
- Importes recalculados server-side; pagos verificados contra PayPal; idempotencia por `paypal_order_id`.
- Stock con decremento atómico y control de concurrencia.
- Credenciales solo en `.env` (no versionado); PayPal secret únicamente en el backend.

## Pruebas

```bash
# Backend: 81 tests (integridad del modelo, auth/RBAC, catálogo, carrito,
# comentarios, checkout con PayPal mockeado, admin)
docker compose exec backend npm test

# Frontend: tests del store del carrito
docker compose exec frontend npm test
```

## OpenSpec

La planificación completa vive en `openspec/changes/` (13 changes). Para ver el estado:

```bash
openspec list
```

## Notas

- Las imágenes de producto del seed son URLs de placeholder (picsum.photos); se pueden reemplazar desde el panel administrativo.
- Todo el flujo de pago usa **Sandbox**: no se realizan transacciones con dinero real.
