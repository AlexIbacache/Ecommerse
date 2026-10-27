# Design

## Context

El servicio `db` (PostgreSQL 16) ya está definido en `setup-infra-foundation`. Ver `proposal.md` — Why para la motivación. El modelo debe sostener catálogo, autenticación, comentarios, pedidos y la verificación de pagos PayPal, que concentran el 30% de la evaluación en seguridad/lógica de backend.

## Goals / Non-Goals

**Goals:**

- Integridad garantizada por la base de datos, no solo por la aplicación.
- Migraciones reproducibles y seed idempotente como entregables explícitos.
- Modelo listo para idempotencia de pagos y snapshot de precios históricos.

**Non-Goals:**

- Variaciones de productos, cupones, wishlist u otros bonus (fuera de scope confirmado).
- Auditoría/historial de actividad administrativa (bonus, fuera de scope).

## Decisions

- **Prisma como ORM y gestor de migraciones** (decisión confirmada): schema declarativo, migraciones versionadas, cliente type-safe y `Decimal` nativo para dinero. Alternativa: Drizzle — descartada por tooling de migraciones más joven.
- **Tabla `roles` en lugar de enum de Postgres.** El documento exige "al menos" dos roles; una tabla permite agregar roles sin migrar un enum y modela la relación users→roles pedida. Alternativa: enum `Role` — más simple pero rígido.
- **`NUMERIC(10,2)` para todo importe; cálculos con Prisma `Decimal`.** Jamás `Float`. Alternativa: enteros en centavos — equivalente en precisión, pero `NUMERIC(10,2)` es más legible en SQL directo y suficiente con una sola moneda.
- **Enums nativos de Postgres para estados** (`OrderStatus`: PENDIENTE_PAGO/PAGADO/PAGO_FALLIDO/CANCELADO; `PaymentStatus`: CREADA/APROBADA/COMPLETADA/FALLIDA/CANCELADA; `CommentStatus`: VISIBLE/OCULTO). Los estados son un conjunto cerrado y estable; los enums los hacen imposibles de violar desde la app.
- **`payments.paypal_order_id UNIQUE` como clave de idempotencia** y `payments.order_id UNIQUE` (relación 1:1 pedido↔pago). La base de datos misma impide pagos duplicados aunque falle la lógica de aplicación.
- **`order_items.unit_price` como snapshot** desacoplado del precio actual del producto; `product_id` se conserva como referencia histórica sin borrado en cascada.
- **`product_images` como tabla 1:N** (el detalle de producto exige "imágenes" en plural; el CRUD admin exige mínimo una). Imágenes por URL (decisión confirmada: no hay upload).
- **`comments.user_id` nullable**: NULL identifica comentario anónimo, con `guest_name` obligatorio a nivel aplicación. `comments.status` (VISIBLE/OCULTO) habilita la post-moderación.
- **Índices**: `products(category_id)`, `products(name)`, `comments(product_id)`, `orders(user_id)`, además de los UNIQUE ya citados.
- **Seed con `upsert` por claves naturales** (email, slug, nombre de rol) para garantizar idempotencia sin borrar datos existentes.

## Risks / Trade-offs

- [Drift entre schema.prisma y la DB si alguien edita SQL a mano] → solo se modifica vía migraciones Prisma; `migrate deploy` en el arranque del backend.
- [Tabla roles añade un join en cada consulta de usuario] → costo despreciable a esta escala; se puede incluir el rol con `include` en la misma query.
- [CHECK constraints duplican validaciones de la app] → intencional: la DB es la última línea de defensa si la aplicación falla (defense in depth).
