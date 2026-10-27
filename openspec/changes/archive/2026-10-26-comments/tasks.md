# Tasks

> Completado (2026-10-26): 7/7 tareas verificadas. Backend: `POST /products/:id/comments` con
> sesión opcional (`@OptionalAuth`: con cuenta asocia `user_id`; anónimo exige `guest_name`),
> validación Zod (3–1000), rate limit por IP (`@Throttle` 10/min) y por usuario (5/min en
> servicio), contenido tratado como texto plano; `GET /products/:id/comments` paginado, orden
> descendente, solo `VISIBLE`. Frontend: sección de comentarios en el detalle con listado,
> paginación, skeleton, empty/error states, formulario adaptado (nombre de invitado si es
> anónimo), validación cliente y toasts (400/429). Tests backend 46/46 (6 suites). Extra: el
> cliente HTTP renueva la sesión automáticamente ante 401 (refresh + reintento).
> Evidencia visual: comentario anónimo con badge "visitante" y fecha, formulario funcional.

## 1. API de comentarios (backend)

- [x] 1.1 Implementar `POST /products/:id/comments` aceptando sesión opcional: asocia `user_id` si hay sesión y exige `guest_name` si no la hay; valida contenido con Zod; verificar ambos flujos y el 400 sin nombre en anónimos
- [x] 1.2 Implementar `GET /products/:id/comments` con paginación y orden descendente por fecha, devolviendo solo comentarios visibles con autor y fecha; verificar listado y que comentarios ocultos no aparecen
- [x] 1.3 Aplicar rate limiting a la creación de comentarios (por IP y por usuario); verificar respuesta 429 tras superar el límite
- [x] 1.4 Verificar con un test que un comentario con HTML/script se almacena y sirve como texto inerte (sin ejecución)

## 2. Tests de comentarios

- [x] 2.1 Tests de integración: comentario autenticado, anónimo, validaciones 400, rate limit 429 y contenido malicioso inerte; verificar que todos pasan

## 3. Sección de comentarios (frontend)

- [x] 3.1 Implementar la sección de comentarios en el detalle de producto: listado con autor/fecha, paginación, skeleton de carga y empty state; verificar los tres estados
- [x] 3.2 Implementar el formulario de comentario adaptado al contexto (usa la cuenta si hay sesión; pide nombre visible si es anónimo) con validación en cliente, estado de envío y toasts de éxito/error; verificar publicación y manejo de errores 400/429
