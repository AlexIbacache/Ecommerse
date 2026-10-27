# Tasks

> Completado (2026-10-26): 6/6 tareas verificadas. Backend `/admin/orders` (listado con cliente,
> fecha, total y estados; detalle con ítems, cantidades, importes, cliente, estado de pago e
> identificadores PayPal) y `/admin/comments` (listado con producto/autor/estado; ocultar/mostrar y
> eliminar). Todo con rol ADMINISTRADOR (cliente 403). Frontend: tabla de ventas con paginación y
> enlace al detalle; página de detalle de venta con ítems, totales y transacción PayPal; moderación
> de comentarios con ocultar/mostrar y eliminación con confirmación. Tests 81/81 (11 suites),
> estables en dos corridas consecutivas.
> Verificado en navegador: venta #69 con cliente y estado, comentario del visitante con acciones.

## 1. API de ventas (backend)

- [x] 1.1 Implementar `GET /admin/orders` (todos los pedidos con cliente, fecha, total, estado del pedido y del pago, paginado) y `GET /admin/orders/:id` (detalle con ítems, cantidades, importes, cliente, estado e identificador de transacción PayPal); verificar con tests que los datos coinciden con lo registrado y que CLIENTE recibe 403

## 2. API de moderación (backend)

- [x] 2.1 Implementar endpoints de moderación: ocultar/mostrar comentario (cambio de estado) y eliminar comentario; verificar con tests los cambios de visibilidad, la eliminación y el 403 para CLIENTE

## 3. Ventas (frontend)

- [x] 3.1 Implementar la tabla de ventas del panel con cliente, fecha, total, estado del pedido y badge de estado de pago, con paginación y skeletons; verificar consistencia con la API
- [x] 3.2 Implementar la página de detalle de venta con ítems, cantidades, importes, datos del cliente, estado del pago e identificador PayPal; verificar que refleja la transacción registrada

## 4. Moderación de comentarios (frontend)

- [x] 4.1 Implementar la sección de comentarios del panel (listado con producto, autor, fecha y estado) con acciones de ocultar/mostrar y eliminación con diálogo de confirmación; verificar que ocultar quita el comentario del storefront y eliminar lo remueve por completo
- [x] 4.2 Verificar las secciones de ventas y comentarios en 360px, 768px y 1280px
