# customer-account Specification

## Purpose
Cubre la cuenta del cliente: consulta y edición de la información básica de su perfil, historial de sus compras y detalle de cada pedido propio.

## Requirements

### Requirement: Consulta y edición de información básica del perfil

El cliente autenticado SHALL poder visualizar los datos de su cuenta (nombre, email, rol) y modificar su información básica (nombre y email), con validación y unicidad de email. El rol SHALL ser de solo lectura para el propio usuario.

#### Scenario: Visualizar perfil

- **WHEN** un cliente autenticado abre su página de cuenta
- **THEN** ve su nombre, email y rol actuales

#### Scenario: Edición exitosa

- **WHEN** el cliente guarda cambios válidos en su nombre o email
- **THEN** los datos se actualizan y recibe confirmación del guardado

#### Scenario: Email en uso por otra cuenta

- **WHEN** el cliente intenta cambiar su email por uno ya registrado en otra cuenta
- **THEN** el backend responde 409 y los datos no cambian

#### Scenario: Intento de cambiar el rol

- **WHEN** la solicitud de actualización del perfil incluye un cambio de rol
- **THEN** el backend ignora o rechaza ese campo y el rol permanece inalterado

### Requirement: Historial de compras

El cliente SHALL poder consultar el historial de sus pedidos con fecha, estado del pedido, estado del pago y total, ordenados del más reciente al más antiguo.

#### Scenario: Historial con compras

- **WHEN** un cliente con compras abre su historial
- **THEN** ve sus pedidos con fecha, estado y total

#### Scenario: Historial vacío

- **WHEN** un cliente sin compras abre su historial
- **THEN** ve un empty state que lo invita a explorar el catálogo

### Requirement: Detalle de pedido propio

El cliente SHALL poder ver el detalle completo de cada pedido propio: ítems comprados con cantidades y precios del momento de la compra, total, estado del pedido y estado del pago.

#### Scenario: Detalle consistente con la compra

- **WHEN** un cliente abre el detalle de uno de sus pedidos
- **THEN** ve los productos comprados con las cantidades y los importes registrados al momento de la compra, junto al estado del pedido y del pago

#### Scenario: Detalle de pedido ajeno

- **WHEN** un cliente intenta abrir el detalle de un pedido de otro usuario
- **THEN** el backend responde 404 y la interfaz muestra que el pedido no existe
