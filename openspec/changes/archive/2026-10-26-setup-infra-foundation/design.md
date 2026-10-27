# Design

## Context

Repositorio vacío. Ver `proposal.md` — Why para la motivación. Restricciones del documento de requisitos: mínimo tres servicios Docker comunicados, persistencia real, levantado sencillo, y prohibido que el CRUD dependa de LocalStorage.

## Goals / Non-Goals

**Goals:**

- Un solo comando (`docker compose up`) levanta frontend, backend y base de datos.
- Datos persistentes en volumen nombrado.
- Configuración 100% por variables de entorno, con `.env.example` documentado.

**Non-Goals:**

- Hardening de producción (TLS, secretos gestionados, límites de recursos).
- CI/CD.
- Imágenes optimizadas de producción (se definen Dockerfiles de desarrollo; el de producción se evalúa en `hardening-and-delivery` si hiciera falta).

## Decisions

- **PostgreSQL 16 (`postgres:16-alpine`) como servicio `db`.** Requerido por las decisiones confirmadas del proyecto (transacciones, `NUMERIC`, CHECK constraints). Alternativa considerada: MySQL — descartada por constraints y DDL transaccional más débiles.
- **Volumen nombrado `pgdata` montado en `/var/lib/postgresql/data`.** Alternativa: bind mount — descartada por problemas de permisos y portabilidad en Windows.
- **Healthcheck con `pg_isready` + `depends_on: condition: service_healthy` para el backend.** Evita crashes de arranque del backend cuando la DB aún no acepta conexiones. Alternativa: retries en la app — se mantiene como red de seguridad, pero la ordenación la garantiza Compose.
- **Red interna dedicada (`ecommerce-net`)**: los servicios se resuelven por nombre (`db`, `backend`); solo se publican los puertos necesarios al host (3000 frontend, 4000 backend, 5432 db para inspección local).
- **Dockerfiles de desarrollo con hot reload** (Next.js dev server; NestJS con watch). Los directorios de código se montan como volúmenes para refljar cambios sin rebuild.
- **`.env` único en la raíz** consumido por `docker-compose.yml` (directiva `env_file` / interpolación), con `.env.example` versionado sin valores reales. El backend valida su configuración al boot con Zod y falla rápido con mensaje explícito.
- **Puertos**: frontend 3000, backend 4000, Postgres 5432. `DATABASE_URL` del backend apunta a `db:5432` (red interna).

## Risks / Trade-offs

- [Backend arranca antes que Postgres] → healthcheck + `depends_on: service_healthy`; además Prisma reintenta la conexión.
- [Drift entre entorno dev y la entrega final] → README documenta comandos exactos; `hardening-and-delivery` verifica levantado desde cero en máquina limpia.
- [Hot reload de Next.js en Windows/Docker puede ser lento] → aceptable para desarrollo; no afecta la entrega porque la revisión corre con los mismos contenedores.
- [Credenciales filtradas en el repo] → `.env` en `.gitignore`; solo se versiona `.env.example` con placeholders.
