# Proposal

## Why

El repositorio está vacío y el documento de requisitos exige una aplicación contenerizada con al menos tres servicios independientes (frontend Next.js, backend Node.js, base de datos en Docker) que se comuniquen entre sí, persistan información ante reinicios de contenedores y se levanten de manera sencilla. Sin esta base no puede comenzar ningún otro change.

## What Changes

- Crear la estructura de monorepo: `frontend/`, `backend/`, `docs/`, con `docker-compose.yml` en la raíz.
- Definir Docker Compose con tres servicios (frontend Next.js, backend NestJS, PostgreSQL 16), red interna, volumen nombrado para la base de datos y healthchecks.
- Crear Dockerfiles de desarrollo para frontend y backend con hot reload.
- Proveer `.env.example` sin credenciales reales; el backend valida sus variables de entorno al arrancar.
- Escribir README inicial con los comandos para levantar el entorno completo.

## Capabilities

### New Capabilities

- `dev-environment`: orquestación Docker Compose de los tres servicios con comunicación interna, persistencia real en volumen nombrado, arranque ordenado por salud de la base de datos y configuración mediante variables de entorno.

### Modified Capabilities

(sin cambios)

## Impact

- Código: crea la estructura de carpetas del monorepo; no existe código previo afectado.
- Dependencias: Docker, Docker Compose, imagen `postgres:16-alpine`, imágenes base de Node.js.
- Sistemas: habilita todos los changes posteriores (schema, auth, catálogo, checkout, admin).
