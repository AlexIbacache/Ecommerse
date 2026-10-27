# Tasks

> Completado (2026-10-26): 13/13 tareas verificadas. Flujo de compra completo: `POST /orders`
> (recalcula importes server-side, snapshot de precios, 409 si stock insuficiente), `POST
> /orders/:id/paypal` (crea la orden en PayPal y persiste `payment` CREADA), `POST /payments/capture`
> (verifica status COMPLETED y monto exacto contra PayPal, confirma en transacción atómica con
> descuento de stock `WHERE stock >= qty`, idempotente por `paypal_order_id`), cancelación, fallos,
> errores de comunicación (502 con pedido intacto) y reconciliación en `GET /orders/:id`. Cliente
> PayPal con OAuth cacheado y credenciales solo en backend. Frontend: `/checkout`, botón PayPal
> (SDK sandbox), `/checkout/resultado`. Tests 59/59 (7 suites), incluye concurrencia (solo una
> compra descuenta el último ítem) y ausencia de endpoint para cambiar estado manualmente.
> Verificado con un mock de PayPal (sin credenciales reales); el flujo real usa `PAYPAL_*` del `.env`.

## 1. Creación de pedidos (backend)

- [x] 1.1 Implementar `POST /orders` (autenticado): valida el carrito contra la DB, recalcula importes, crea pedido PENDIENTE_PAGO con ítems y `unit_price` snapshot; verificar con test que importes manipulados en el payload son ignorados y que stock insuficiente devuelve 409 sin crear pedido
- [x] 1.2 Implementar `GET /orders` (historial propio) y `GET /orders/:id` (detalle propio con ítems y estado de pago); verificar con test que el pedido de otro usuario devuelve 404

## 2. Integración PayPal (backend)

- [x] 2.1 Implementar el cliente HTTP de PayPal Sandbox (OAuth con cache de token, timeouts, base URL Sandbox) leyendo credenciales de env; verificar que el secret no aparece en ninguna respuesta ni en el frontend
- [x] 2.2 Implementar `POST /orders/:id/paypal` que crea la orden en PayPal con el total del pedido y persiste el pago CREADA con `paypal_order_id`; verificar que el monto enviado a PayPal coincide con el total del pedido
- [x] 2.3 Implementar `POST /payments/capture` con verificación server-side (status COMPLETED + monto exacto), confirmación transaccional (descuento atómico de stock + PAGADO) e idempotencia por `paypal_order_id`; verificar con tests: captura feliz, monto inconsistente (no paga), captura duplicada (sin duplicar ni descontar dos veces) y stock agotado entre aprobación y captura (rollback total, PAGO_FALLIDO)
- [x] 2.4 Implementar el manejo de cancelación (CANCELADO), fallos (PAGO_FALLIDO) y errores de comunicación (502 con pedido intacto en PENDIENTE_PAGO); verificar cada caso con tests simulando respuestas de PayPal
- [x] 2.5 Implementar reconciliación en `GET /orders/:id` para pedidos PENDIENTE_PAGO con `paypal_order_id` (consulta estado real a PayPal); verificar que un pago aprobado pero no capturado se resuelve al consultar

## 3. Tests de concurrencia y seguridad de pagos

- [x] 3.1 Test de concurrencia: dos confirmaciones simultáneas sobre el último ítem en stock; verificar que solo una descuenta y la otra queda PAGO_FALLIDO sin stock negativo
- [x] 3.2 Verificar que no existe endpoint que permita al cliente cambiar el estado del pedido ni del pago

## 4. Checkout (frontend)

- [x] 4.1 Implementar la página de checkout (requiere sesión) con resumen de compra validado contra el backend antes de mostrar el botón de pago; verificar que el resumen muestra precios vigentes
- [x] 4.2 Integrar el botón de PayPal JS SDK con `createOrder`/`onApprove`/`onCancel`/`onError` conectados a los endpoints del backend, con estados de procesamiento y botón deshabilitado tras el primer click; verificar el flujo feliz completo en Sandbox
- [x] 4.3 Implementar la página de resultado (éxito, cancelación, fallo, pendiente) con consulta del estado real del pedido al backend; verificar que refleja el estado del backend y no solo la indicación del SDK
- [x] 4.4 Verificar el checkout completo en 360px, 768px y 1280px y los toasts/estados de cada resultado
