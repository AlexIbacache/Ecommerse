# Design

## Context

Sobre el modelo de `database-schema-seed` y la validación Zod de `auth-and-rbac`. Ver `proposal.md` — Why. API de solo lectura pública; las decisiones aquí fijan el contrato de consulta que reutilizarán el storefront y el panel admin.

## Goals / Non-Goals

**Goals:**

- Contrato de consulta único y predecible (búsqueda, filtros, orden, paginación) reutilizable por storefront y admin.
- Respuestas con metadata de paginación consistente.

**Non-Goals:**

- Escritura de productos (pertenece a `admin-products`).
- Búsqueda full-text avanzada (Postgres FTS) — la búsqueda por nombre con `contains` case-insensitive alcanza a esta escala.

## Decisions

- **Contrato de paginación envelope**: `{ data: [...], meta: { page, pageSize, totalItems, totalPages } }` en todos los listados del proyecto. Alternativa: headers `X-Total-Count` — menos descubrible para el frontend.
- **Query params**: `q` (búsqueda por nombre, `contains` case-insensitive), `category` (slug), `sort` (whitelist: `price_asc`, `price_desc`, `name_asc`, `createdAt_desc`), `page` (≥1), `pageSize` (1–48, default 12). Whitelist de `sort` para impedir inyección de campos arbitrarios en `orderBy`.
- **Disponibilidad derivada**: `available = isActive && stock > 0` calculado en la respuesta; el catálogo público filtra `isActive = true` siempre.
- **Detalle por slug** (no por id) en la API pública: URLs legibles y SEO; el id queda para operaciones internas/admin.

## Risks / Trade-offs

- [Búsqueda `contains` sin índice trigram puede degradar con muchos productos] → aceptable al volumen de la práctica; existe índice sobre `name` y la migración a FTS es un bonus fuera de scope.
