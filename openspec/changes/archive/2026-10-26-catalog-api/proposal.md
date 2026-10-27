# Proposal

## Why

La tienda pública necesita una API de catálogo real: cualquier visitante debe poder visualizar, buscar, filtrar por categoría, ordenar y paginar productos, con precios, imágenes y disponibilidad provenientes de la base de datos. El documento prohíbe explícitamente datos simulados en el frontend.

## What Changes

- Backend: endpoints públicos de categorías (listado) y productos (listado con búsqueda, filtro por categoría, ordenamiento y paginación; detalle por slug con imágenes y disponibilidad).
- Backend: validación Zod de query params (página, tamaño, orden permitido, término de búsqueda) con límites defensivos.
- Backend: solo productos activos y categorías visibles en la API pública.

## Capabilities

### New Capabilities

- `product-catalog`: consulta pública del catálogo — listado de productos con búsqueda, filtrado, orden y paginación, detalle por slug y listado de categorías, todo servido desde la base de datos.

### Modified Capabilities

(sin cambios)

## Impact

- Código: módulos `products` y `categories` en el backend (solo operaciones de lectura públicas).
- Dependencias: modelo de datos de `database-schema-seed`.
- Sistemas: alimenta `storefront-ui`, `cart` (validación de carrito) y `admin-products` (extiende a escritura).
