# Proposal

## Why

El documento exige una pasarela PayPal exclusivamente Sandbox con verificación del resultado en el backend, importes calculados desde una fuente confiable y consistencia entre el estado de PayPal, el pedido y la venta registrada. Debe gestionar pagos completados, rechazados, cancelaciones, errores de comunicación, operaciones duplicadas y estados pendientes. Es el flujo donde más se evalúa la seguridad.

## What Changes

- Backend: creación de órdenes server-side a partir del carrito validado (totales recalculados desde la base de datos, snapshot de precios, estado inicial PENDIENTE_PAGO); el checkout exige autenticación.
- Backend: integración con PayPal Orders API v2 en Sandbox — crear orden de pago, capturarla y verificar status y monto exacto contra el pedido antes de confirmarlo.
- Backend: confirmación transaccional del pago (marcar PAGADO + descontar stock atómicamente), idempotencia por `paypal_order_id`, y manejo de cancelaciones, fallos, errores de comunicación y pagos pendientes.
- Frontend: página de checkout con resumen de compra, botón de PayPal Sandbox, manejo de aprobación/cancelación/error y página de resultado de la compra.

## Capabilities

### New Capabilities

- `order-management`: ciclo de vida del pedido — creación server-side con totales confiables y snapshot de precios, máquina de estados y consulta por parte del cliente propietario.
- `paypal-payments`: integración de pago con PayPal Sandbox — creación, captura y verificación server-side, idempotencia, descuento transaccional de stock y manejo de todos los estados no exitosos.

### Modified Capabilities

(sin cambios)

## Impact

- Código: módulos `orders` y `payments` en el backend; páginas de checkout y resultado en el frontend.
- Dependencias: `auth-and-rbac` (checkout requiere cuenta), `cart` (carrito validado), credenciales PayPal Sandbox en variables de entorno del backend.
- Sistemas: alimenta `customer-profile` (historial), `admin-dashboard` (métricas) y `admin-orders-comments` (ventas).
