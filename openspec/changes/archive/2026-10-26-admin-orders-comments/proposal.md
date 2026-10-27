# Proposal

## Why

El documento exige que el administrador visualice las ventas realizadas con su detalle (productos, cantidades, totales, cliente, estado del pago, fechas) reflejando las transacciones de PayPal Sandbox, y que disponga de alguna forma de moderar o eliminar comentarios cuando corresponda.

## What Changes

- Backend: endpoints administrativos de ventas (listado con estado de pago, cliente, fecha y total; detalle con ítems, cantidades, totales, cliente, estado del pago y fechas).
- Backend: endpoints de moderación de comentarios (ocultar/mostrar, eliminar) para el administrador.
- Frontend: sección de ventas del panel con tabla y página de detalle; sección de comentarios con acciones de moderación y confirmaciones.

## Capabilities

### New Capabilities

- `admin-sales`: consulta administrativa de las ventas — listado y detalle de pedidos con productos, cantidades, totales, cliente, estado del pago PayPal y fechas, consistente con las transacciones registradas.

### Modified Capabilities

- `product-comments`: se agrega la moderación por parte del administrador (ocultar/mostrar y eliminar comentarios).

## Impact

- Código: endpoints admin en módulos `orders` y `comments`; secciones de ventas y comentarios del panel.
- Dependencias: `checkout-paypal` (ventas y pagos registrados), `comments` (capability base de comentarios), `admin-dashboard` (estructura del panel).
- Sistemas: completa las operaciones del panel administrativo.
