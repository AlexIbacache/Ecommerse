# Tasks

> Completado (2026-10-26): 3/3 tareas verificadas. Backend: `GET /admin/metrics` protegido con
> `@Roles(ADMINISTRADOR)` usando agregaciones reales (total de productos, ventas PAGADO, ingresos,
> últimos 5 pedidos con cliente, productos con stock < 5 y distribución por estado). Frontend: layout
> `/admin` con navegación (Dashboard, Productos, Ventas, Comentarios) protegido por rol y dashboard
> con tarjetas, pedidos recientes, bajo stock, barras de distribución, skeletons y error con
> reintento. Tests 69/69 (9 suites): métricas coinciden con la DB, cliente 403, anónimo 401.
> Verificado en navegador con el admin demo: Productos 10, Ventas 0, Ingresos $0.00, bajo stock 3,
> pedido reciente y distribución; consola sin errores.

## 1. API de métricas (backend)

- [x] 1.1 Implementar `GET /admin/metrics` protegido por rol ADMINISTRADOR con agregaciones reales: total de productos, total de ventas (PAGADO), ingresos, pedidos recientes, distribución por estado y productos bajo el umbral de stock; verificar con tests de integración que los números coinciden con los datos de la base y que CLIENTE/visitante reciben 403/401

## 2. Panel administrativo (frontend)

- [x] 2.1 Implementar el layout del panel `/admin` con navegación propia (dashboard, productos, ventas, comentarios) protegida por rol; verificar que un cliente es redirigido y la navegación funciona en mobile y desktop
- [x] 2.2 Implementar el dashboard con tarjetas de métricas, tabla/lista de pedidos recientes, lista de productos con bajo stock y visualización de la distribución por estado, con skeletons y error state con reintento; verificar que los datos mostrados coinciden con la API y los estados de carga/error
