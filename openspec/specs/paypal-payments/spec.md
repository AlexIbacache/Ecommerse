# paypal-payments Specification

## Purpose
Define la integración de pago con PayPal Sandbox: creación y captura verificadas siempre desde el backend, idempotencia ante operaciones duplicadas, descuento transaccional de stock y manejo de cancelaciones, fallos, errores y pagos pendientes.

## Requirements

### Requirement: Creación de la orden de pago en PayPal

Para cada pedido, el backend SHALL crear la orden de pago mediante la API de PayPal (entorno Sandbox) usando como monto el total del pedido calculado en el backend, y SHALL persistir el pago con el `paypal_order_id` devuelto y estado inicial CREADA. Las credenciales de PayPal SHALL existir solo en el backend.

#### Scenario: Orden de pago creada

- **WHEN** el backend crea la orden de pago de un pedido en PENDIENTE_PAGO
- **THEN** el monto enviado a PayPal coincide exactamente con el total del pedido y el `paypal_order_id` queda registrado

#### Scenario: Credenciales protegidas

- **WHEN** el frontend inicia el flujo de pago
- **THEN** solo utiliza el client-id público; el secret de PayPal nunca se expone al navegador

### Requirement: Captura y verificación server-side del pago

Tras la aprobación en PayPal, el backend SHALL capturar la orden y verificar directamente contra la API de PayPal que el estado es COMPLETED y que el monto capturado coincide exactamente con el total del pedido. Un pago MUST NOT considerarse exitoso por indicación del frontend.

#### Scenario: Pago verificado

- **WHEN** el backend captura la orden y PayPal confirma estado COMPLETED con el monto exacto del pedido
- **THEN** el pago queda COMPLETADA y el pedido transita a PAGADO

#### Scenario: Monto capturado inconsistente

- **WHEN** el monto devuelto por PayPal no coincide con el total del pedido
- **THEN** el pedido NO se marca como pagado y la inconsistencia queda registrada para revisión

#### Scenario: Indicación solo del frontend

- **WHEN** el frontend notifica una aprobación pero el backend no puede confirmarla contra la API de PayPal
- **THEN** el pedido no se marca como pagado

### Requirement: Idempotencia de pagos

El `paypal_order_id` SHALL ser único en el sistema. Reintentos, recargas o envíos duplicados de la misma aprobación SHALL devolver el resultado ya registrado sin crear pagos ni pedidos duplicados y sin descontar stock dos veces.

#### Scenario: Captura duplicada

- **WHEN** se solicita la captura del mismo `paypal_order_id` por segunda vez
- **THEN** el backend devuelve el estado ya registrado del pago sin duplicar registros ni descontar stock nuevamente

### Requirement: Descuento de stock al confirmarse el pago

El stock SHALL descontarse únicamente cuando el pago queda verificado, dentro de una transacción que descuenta cada ítem de forma atómica (`stock >= cantidad`) y marca el pedido como PAGADO. Si algún ítem ya no tiene stock suficiente, la transacción SHALL revertirse por completo y el pedido SHALL marcarse como PAGO_FALLIDO.

#### Scenario: Confirmación con stock suficiente

- **WHEN** el pago se verifica y todos los ítems tienen stock suficiente
- **THEN** en una única transacción se descuenta el stock de cada ítem y el pedido queda PAGADO

#### Scenario: Stock agotado entre aprobación y captura

- **WHEN** al confirmar el pago un ítem ya no tiene stock suficiente
- **THEN** no se descuenta stock de ningún ítem y el pedido queda PAGO_FALLIDO con el motivo registrado

#### Scenario: Compras concurrentes del último ítem

- **WHEN** dos pagos del mismo producto con stock 1 se confirman concurrentemente
- **THEN** solo uno descuenta el stock; el otro queda PAGO_FALLIDO sin stock negativo

### Requirement: Manejo de cancelaciones, fallos, errores y pendientes

El sistema SHALL gestionar: cancelación en PayPal (pedido CANCELADO), pago rechazado o fallido (pedido PAGO_FALLIDO), errores de comunicación con PayPal (sin marcar el pedido como pagado, con error comunicable al cliente) y pagos que quedan pendientes (pedido PENDIENTE_PAGO consultable).

#### Scenario: El cliente cancela en PayPal

- **WHEN** el cliente cancela la operación en la ventana de PayPal
- **THEN** el pedido queda CANCELADO y el cliente puede ver ese estado

#### Scenario: Error de comunicación con PayPal

- **WHEN** la llamada del backend a PayPal falla por red o por un 5xx de PayPal
- **THEN** el pedido no se marca como pagado, el error se registra y el cliente recibe un mensaje para reintentar

#### Scenario: Pago que queda pendiente

- **WHEN** el cliente cierra la ventana de PayPal sin aprobar ni cancelar
- **THEN** el pedido permanece PENDIENTE_PAGO y su estado real puede consultarse posteriormente desde el backend
