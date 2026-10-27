# admin-product-management Specification

## Purpose
Permite al administrador gestionar el catálogo completo: crear, visualizar, editar y eliminar productos con todos sus campos, con listado administrativo y eliminación que preserva el histórico de ventas.

## Requirements

### Requirement: Creación y edición de productos

El administrador SHALL poder crear y editar productos con nombre, descripción, precio mayor a cero, categoría existente, al menos una imagen por URL, stock mayor o igual a cero y estado de disponibilidad. Todos los campos SHALL validarse en el backend.

#### Scenario: Creación válida

- **WHEN** el administrador crea un producto con todos los campos válidos
- **THEN** el producto queda persistido y pasa a ser visible en el catálogo público si está activo

#### Scenario: Datos inválidos

- **WHEN** se envía un producto con precio menor o igual a cero, stock negativo, categoría inexistente o sin imágenes
- **THEN** el backend responde 400 indicando los campos inválidos y no persiste nada

#### Scenario: Rol insuficiente

- **WHEN** un usuario con rol CLIENTE intenta crear, editar o eliminar un producto
- **THEN** el backend responde 403

### Requirement: Listado administrativo de productos

El administrador SHALL disponer de un listado con búsqueda por nombre, filtro por categoría, ordenamiento y paginación, que incluya también productos inactivos y muestre stock y disponibilidad.

#### Scenario: Listado con controles

- **WHEN** el administrador aplica búsqueda, filtro de categoría y orden en el listado
- **THEN** los resultados respetan los criterios combinados e incluyen productos inactivos

### Requirement: Eliminación segura de productos

Al eliminar un producto, el sistema SHALL borrarlo físicamente solo si no figura en ningún pedido; si tiene ventas asociadas, SHALL desactivarlo (deja de ser visible en el catálogo) preservando el histórico. La acción SHALL requerir confirmación explícita en la interfaz.

#### Scenario: Producto sin ventas

- **WHEN** el administrador confirma la eliminación de un producto que no figura en pedidos
- **THEN** el producto se elimina físicamente

#### Scenario: Producto con ventas

- **WHEN** el administrador confirma la eliminación de un producto que figura en pedidos
- **THEN** el producto queda desactivado, desaparece del catálogo público y los pedidos históricos conservan su información
