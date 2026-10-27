# Tasks

> Completado (2026-10-26): 6/6 tareas verificadas. Endpoints públicos `/categories`,
> `/products` (búsqueda, filtro por categoría, orden y paginación con envelope `{ data, meta }`)
> y `/products/:slug`. Validación Zod de query params (pageSize 1–48, whitelist de sort).
> Solo productos activos. Tests de integración 11/11 en el suite de catálogo (32/32 total).

## 1. Módulo de categorías (backend)

- [x] 1.1 Implementar `GET /categories` (listado público con nombre y slug); verificar respuesta desde la base de datos con los datos del seed

## 2. Módulo de productos (backend)

- [x] 2.1 Implementar `GET /products` con búsqueda por nombre (case-insensitive), filtro por categoría, ordenamiento (precio asc/desc, nombre, recientes) y paginación (`page`, `pageSize`, total); verificar cada criterio por separado y combinados
- [x] 2.2 Implementar validación Zod de query params con `pageSize` máximo y whitelist de ordenamiento; verificar 400 ante parámetros inválidos
- [x] 2.3 Implementar `GET /products/:slug` con imágenes ordenadas, categoría, stock y disponibilidad; verificar 200 en producto activo y 404 en slug inexistente o producto inactivo
- [x] 2.4 Verificar que el listado y el detalle excluyen siempre productos inactivos en la API pública

## 3. Tests del catálogo

- [x] 3.1 Tests de integración de los endpoints (búsqueda, filtro, orden, paginación, detalle, 404, validación 400, exclusión de inactivos); verificar que todos pasan contra la base de datos de prueba
