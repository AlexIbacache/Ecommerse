# access-control Specification

## Purpose
Garantiza que toda operación protegida del backend verifique la identidad, el rol y la propiedad del recurso solicitado, de modo que ninguna restricción dependa únicamente de la interfaz.

## Requirements

### Requirement: Protección de endpoints en el backend

Todo endpoint no público SHALL exigir autenticación válida, y los endpoints administrativos SHALL exigir además el rol ADMINISTRADOR. La ausencia de token, un token expirado o un token manipulado SHALL producir 401; un rol insuficiente SHALL producir 403.

#### Scenario: Cliente intenta una operación administrativa

- **WHEN** un usuario autenticado con rol CLIENTE invoca un endpoint de administración (por ejemplo crear un producto)
- **THEN** el backend responde 403 aunque el token sea válido

#### Scenario: Sin autenticación

- **WHEN** se invoca un endpoint protegido sin cookie de sesión
- **THEN** el backend responde 401

#### Scenario: Token manipulado

- **WHEN** se invoca un endpoint protegido con un JWT alterado o con firma inválida
- **THEN** el backend responde 401

### Requirement: Aislamiento de datos entre usuarios

Las operaciones sobre recursos pertenecientes a un usuario (perfil, pedidos) SHALL verificar en el backend que el recurso pertenece al usuario autenticado, filtrando por el identificador de la sesión y nunca confiando en identificadores enviados por el cliente.

#### Scenario: Acceso a recurso propio

- **WHEN** un usuario autenticado consulta su propio perfil o uno de sus pedidos
- **THEN** el backend devuelve los datos solicitados

#### Scenario: Intento de acceso a recurso ajeno (IDOR)

- **WHEN** un usuario autenticado solicita un pedido cuyo identificador pertenece a otro usuario
- **THEN** el backend responde 404 sin revelar que el recurso existe

### Requirement: Restricciones independientes de la interfaz

Las restricciones de acceso SHALL existir íntegramente en el backend; ocultar o deshabilitar controles en el frontend MUST NOT considerarse un mecanismo de protección.

#### Scenario: Operación fuera del flujo normal de la UI

- **WHEN** se construye manualmente una solicitud HTTP a una operación que la interfaz no muestra para el rol actual
- **THEN** el backend aplica la misma verificación de rol y propiedad que aplicaría al flujo normal
