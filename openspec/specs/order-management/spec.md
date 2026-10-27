# order-management Specification

## Purpose
Define el ciclo de vida del pedido: creación server-side con importes calculados desde la base de datos y snapshot de precios, máquina de estados controlada por el backend y consulta por el cliente propietario.

## Requirements

### Requirement: Creación de pedido con importes confiables

El sistema SHALL crear pedidos únicamente para usuarios autenticados, recalculando en el backend el importe de cada ítem desde los precios vigentes en la base de datos y el total del pedido como suma de esos importes. Cualquier importe enviado por el cliente SHALL ser ignorado. Cada ítem SHALL congelar su `unit_price` al momento de la creación.

#### Scenario: Pedido creado con totales del backend

- **WHEN** un cliente autenticado inicia el checkout con un carrito válido
- **THEN** se crea el pedido en estado PENDIENTE_PAGO con ítems a precio vigente y total calculado en el backend

#### Scenario: Importe manipulado por el cliente

- **WHEN** la solicitud de creación de pedido incluye importes alterados (menores a los reales)
- **THEN** el backend ignora esos valores y calcula los importes desde la base de datos

#### Scenario: Checkout sin autenticación

- **WHEN** un visitante sin sesión intenta crear un pedido
- **THEN** el backend responde 401

#### Scenario: Stock insuficiente al crear el pedido

- **WHEN** algún ítem del carrito no tiene stock suficiente al momento de crear el pedido
- **THEN** el backend responde 409 indicando los ítems en conflicto y no crea el pedido

### Requirement: Máquina de estados del pedido

El pedido SHALL transitar por los estados PENDIENTE_PAGO, PAGADO, PAGO_FALLIDO y CANCELADO, y las transiciones SHALL producirse únicamente por lógica del backend (resultado de la verificación de pago), nunca por solicitud directa del cliente.

#### Scenario: Transición válida

- **WHEN** el backend confirma el resultado del pago de un pedido en PENDIENTE_PAGO
- **THEN** el pedido transita a PAGADO, PAGO_FALLIDO o CANCELADO según el resultado verificado

#### Scenario: El cliente no puede cambiar el estado

- **WHEN** un cliente solicita directamente cambiar el estado de un pedido (por ejemplo marcarlo como pagado)
- **THEN** no existe endpoint que lo permita y el estado permanece inalterado

### Requirement: Consulta de pedidos propios

El cliente SHALL poder consultar el historial de sus propios pedidos y el detalle de cada uno (ítems, cantidades, precios congelados, totales, estado del pedido y estado del pago), respetando el aislamiento entre usuarios.

#### Scenario: Historial propio

- **WHEN** un cliente autenticado consulta su historial de pedidos
- **THEN** ve únicamente sus pedidos con su estado y fecha

#### Scenario: Pedido ajeno

- **WHEN** un cliente solicita el detalle de un pedido que pertenece a otro usuario
- **THEN** el backend responde 404
