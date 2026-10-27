# Proposal

## Why

El documento exige un CRUD completo de productos para el administrador (crear, visualizar, editar, eliminar) manejando nombre, descripción, precio, categoría, imagen, stock y estado de disponibilidad, con listado que incluya búsqueda, filtros, ordenamiento y paginación. Es el núcleo operativo del panel.

## What Changes

- Backend: endpoints administrativos de productos (crear, editar, eliminar, listar incluyendo inactivos) con validación Zod y protección por rol ADMINISTRADOR.
- Backend: eliminación segura — si el producto figura en pedidos, se desactiva en lugar de borrarse físicamente para preservar el histórico de ventas.
- Frontend: sección de productos del panel con tabla (búsqueda, filtro por categoría, ordenamiento, paginación), formulario de creación/edición validado y confirmación de acciones destructivas.

## Capabilities

### New Capabilities

- `admin-product-management`: administración completa del catálogo por parte del administrador — CRUD de productos con validación, listado con búsqueda/filtros/orden/paginación y eliminación segura que preserva el histórico de ventas.

### Modified Capabilities

(sin cambios)

## Impact

- Código: endpoints admin en el módulo `products`; sección de productos del panel en el frontend.
- Dependencias: `auth-and-rbac` (rol admin), `catalog-api` (módulo de productos existente), modelo de datos.
- Sistemas: el catálogo público (`storefront-ui`) refleja los cambios que aquí se realicen.
