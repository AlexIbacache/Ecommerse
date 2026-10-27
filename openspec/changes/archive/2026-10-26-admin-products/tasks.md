# Tasks

> Completado (2026-10-26): 8/8 tareas verificadas. Backend `/admin/products` (rol ADMINISTRADOR):
> listado con búsqueda, filtro por categoría, orden (recientes, nombre, precio, stock) y paginación
> incluyendo inactivos; detalle para edición; alta y edición con Zod (precio > 0, stock >= 0,
> categoría existente, 1–5 imágenes URL) y slug autogenerado; borrado seguro (físico sin ventas,
> desactivación con ventas). Frontend: tabla con filtros, orden y paginación, badges de estado,
> dialog de alta/edición con validación cliente + manejo de errores del backend, dialog de borrado
> con aviso de desactivación y toasts. Tests 76/76 (10 suites), incluido 403 de cliente en todas las
> operaciones. Verificado en navegador: tabla con 10 productos, "Sin stock" en el producto sin stock.

## 1. API admin de productos (backend)

- [x] 1.1 Implementar `POST /admin/products` y `PATCH /admin/products/:id` con validación Zod (precio > 0, stock >= 0, categoría existente, ≥1 imagen URL); verificar creación/edición válidas y 400 por cada validación
- [x] 1.2 Implementar `GET /admin/products` con búsqueda, filtro por categoría, ordenamiento y paginación incluyendo inactivos; verificar criterios combinados
- [x] 1.3 Implementar `DELETE /admin/products/:id` con eliminación segura (borrado físico sin ventas, desactivación con ventas); verificar ambos caminos con tests
- [x] 1.4 Verificar con tests que un token de CLIENTE recibe 403 en todos los endpoints admin de productos

## 2. Gestión de productos (frontend)

- [x] 2.1 Implementar la tabla de productos del panel con búsqueda, filtro por categoría, ordenamiento, paginación, indicador de stock y de disponibilidad; verificar los controles y los skeletons de carga
- [x] 2.2 Implementar el formulario de creación/edición con validación en cliente (Zod), gestión de imágenes por URL y manejo de errores del backend; verificar crear y editar end-to-end
- [x] 2.3 Implementar el diálogo de confirmación de eliminación que informa cuándo el producto será desactivado por tener ventas; verificar ambos resultados con toasts y actualización de la tabla
- [x] 2.4 Verificar la tabla y el formulario en 360px, 768px y 1280px (tabla adaptable, sin overflow)
