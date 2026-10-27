# Proposal

## Why

El documento exige que cualquier visitante pueda comentar productos —como usuario registrado (asociado a su cuenta) o como anónimo (sin crear cuenta)— con validación de contenido, manejo de errores, protección frente a contenido malicioso, prevención razonable de spam y protección de datos de los usuarios.

## What Changes

- Backend: endpoints para crear comentarios (autenticado o anónimo con nombre visible) y listar los comentarios visibles de un producto con paginación.
- Backend: validación de contenido con Zod (longitud mínima/máxima), protección frente a contenido malicioso y rate limiting por IP/usuario para prevenir spam.
- Frontend: sección de comentarios en el detalle de producto con formulario (adaptado a visitante o a usuario autenticado), listado, estados de carga/vacío/error y feedback con toasts.

## Capabilities

### New Capabilities

- `product-comments`: comentarios de producto para visitantes anónimos y usuarios registrados, con validación, protección contra contenido malicioso, prevención de abuso y listado en el detalle del producto.

### Modified Capabilities

(sin cambios)

## Impact

- Código: módulo `comments` en el backend; sección de comentarios en el detalle de producto del storefront.
- Dependencias: `auth-and-rbac` (asociación a cuenta cuando hay sesión), `storefront-ui` (página de detalle), modelo `comments` de `database-schema-seed`.
- Sistemas: `admin-orders-comments` extiende esta capability con la moderación.
