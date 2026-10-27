# admin-sales Specification

## Purpose
Permite al administrador consultar las ventas realizadas: listado de pedidos con su estado de pago y detalle completo de cada operación, consistente con las transacciones de PayPal Sandbox registradas.

## Requirements

### Requirement: Listado administrativo de ventas

El administrador SHALL poder visualizar todas las ventas (pedidos de todos los clientes) con cliente asociado, fecha, total, estado del pedido y estado del pago, con paginación y orden por fecha.

#### Scenario: Listado de ventas

- **WHEN** el administrador abre la sección de ventas
- **THEN** ve todos los pedidos con cliente, fecha, total y estados, del más reciente al más antiguo

#### Scenario: Rol insuficiente

- **WHEN** un usuario con rol CLIENTE solicita el listado de ventas
- **THEN** el backend responde 403

### Requirement: Detalle de venta

El administrador SHALL poder consultar el detalle de cada pedido: productos comprados con cantidades y precios del momento de la compra, totales, cliente asociado, estado del pago (incluyendo identificador de la transacción PayPal) y fechas relevantes.

#### Scenario: Detalle consistente con la transacción

- **WHEN** el administrador abre el detalle de un pedido pagado
- **THEN** ve los productos con cantidades e importes registrados, el cliente, el estado COMPLETED del pago y su identificador de transacción PayPal, coincidiendo con lo registrado en la base de datos

#### Scenario: Pedido con pago fallido o cancelado

- **WHEN** el administrador abre el detalle de un pedido en estado PAGO_FALLIDO o CANCELADO
- **THEN** el estado mostrado refleja fielmente el resultado registrado de la operación en PayPal
