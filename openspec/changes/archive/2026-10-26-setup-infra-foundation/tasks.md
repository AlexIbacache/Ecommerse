# Tasks

> Completado (2026-10-26): 11/11 tareas verificadas con Docker 29.9.2 / Compose v5.6.1.
> Evidencia: `docker compose config` OK; builds de ambas imágenes OK; `/health` responde 200
> con la DB levantada; frontend responde 200; persistencia verificada insertando un registro,
> ejecutando `down` + `up` y comprobando que el dato se conserva en el volumen `pgdata`.

## 1. Estructura del monorepo

- [x] 1.1 Crear la estructura de carpetas `frontend/`, `backend/`, `docs/` y verificar que el árbol resultante coincide con lo definido en la propuesta
- [x] 1.2 Crear `.gitignore` (node_modules, .env, dist, .next) y verificar que `.env` queda excluido del control de versiones

## 2. Docker Compose

- [x] 2.1 Definir `docker-compose.yml` con servicios `frontend`, `backend` y `db` (postgres:16-alpine), red interna, volumen nombrado `pgdata`, healthcheck de `db` y `depends_on: service_healthy`; verificar con `docker compose config` que el archivo es válido
- [x] 2.2 Configurar publicación de puertos (3000, 4000, 5432) y variables de entorno por servicio; verificar que `DATABASE_URL` del backend apunta a `db:5432`

## 3. Dockerfiles de desarrollo

- [x] 3.1 Crear `backend/Dockerfile` de desarrollo (Node 20, instalación de dependencias, watch mode) y verificar que `docker compose build backend` completa sin errores
- [x] 3.2 Crear `frontend/Dockerfile` de desarrollo (Node 20, Next.js dev server) y verificar que `docker compose build frontend` completa sin errores

## 4. Configuración y salud

- [x] 4.1 Crear `.env.example` con todas las variables requeridas (DB, JWT, PayPal placeholders, URLs) sin valores reales, y verificar que basta copiarlo a `.env` para levantar
- [x] 4.2 Implementar validación de variables de entorno al boot del backend (Zod) y verificar que arrancar sin una variable obligatoria falla con mensaje explícito
- [x] 4.3 Implementar `GET /health` en el backend (incluye chequeo de conexión a la DB) y verificar respuesta 200 con el entorno levantado

## 5. Documentación y verificación integral

- [x] 5.1 Escribir README inicial con requisitos previos y comandos de levantado; verificar que los comandos documentados funcionan tal cual están escritos
- [x] 5.2 Verificación integral: con volúmenes limpios, `docker compose up` levanta los tres servicios, `/health` responde 200, el frontend responde 200, y un dato insertado en la DB persiste tras `docker compose down && docker compose up`
