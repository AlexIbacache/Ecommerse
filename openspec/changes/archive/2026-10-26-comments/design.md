# Design

## Context

Sobre `auth-and-rbac` (sesión opcional) y el detalle de producto de `storefront-ui`. Ver `proposal.md` — Why. Los comentarios son la superficie de entrada pública más expuesta: texto libre de anónimos.

## Goals / Non-Goals

**Goals:**

- Comentar sin fricción (con o sin cuenta) sin abrir la puerta a XSS ni spam.
- Modelo de moderación simple compatible con la post-moderación confirmada.

**Non-Goals:**

- Reseñas con puntuación (bonus, fuera de scope).
- Respuestas anidadas a comentarios (no requerido).
- CAPTCHA (el rate limiting se considera la "prevención razonable" que pide el documento).

## Decisions

- **Un solo endpoint `POST /products/:id/comments` con sesión opcional**: si la request trae sesión válida, el autor es `user_id` de la sesión (se ignora cualquier autor enviado); si no, se exige `guest_name`. Así ningún anónimo puede suplantar a un usuario registrado.
- **Contenido como texto plano**: Zod limita longitud (p. ej. 3–1000 caracteres) y el backend almacena el texto tal cual; la defensa XSS vive en el render (React escapa por defecto, prohibido `dangerouslySetInnerHTML` para contenido de usuarios). Alternativa: sanitización con librería — innecesaria si nunca se interpreta HTML.
- **Anti-spam por rate limiting**: `@nestjs/throttler` con límite estricto por IP en el endpoint de creación (y por usuario si hay sesión). Alternativa: CAPTCHA — agrega fricción y un servicio externo; se documenta como mejora posible.
- **Post-moderación (decisión confirmada)**: los comentarios nacen `VISIBLE`; el admin los oculta (`OCULTO`) o elimina desde el panel (implementado en `admin-orders-comments`). El listado público filtra `status = VISIBLE`.
- **Protección de datos**: de los anónimos solo se guarda el nombre visible que ellos mismos escriben; no se almacena IP en la base de datos (el throttler la usa en memoria).

## Risks / Trade-offs

- [Spam distribuido desde múltiples IPs supera el rate limit] → riesgo aceptado como "prevención razonable"; la moderación del admin es la red de contención.
- [Nombre visible de anónimo puede suplantar apodos] → se muestran tal cual sin marca de verificado; los comentarios de usuarios registrados se distinguen visualmente (badge "registrado").
