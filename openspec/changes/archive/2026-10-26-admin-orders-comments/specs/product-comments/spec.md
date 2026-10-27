# Spec Delta

## ADDED Requirements

### Requirement: Moderación de comentarios por el administrador

El administrador SHALL poder ocultar o volver a mostrar cualquier comentario y eliminarlo definitivamente. Los comentarios ocultos SHALL dejar de aparecer en el detalle público del producto.

#### Scenario: Ocultar un comentario

- **WHEN** el administrador oculta un comentario visible
- **THEN** el comentario deja de mostrarse en el detalle público del producto y permanece disponible en el panel

#### Scenario: Mostrar un comentario oculto

- **WHEN** el administrador vuelve a mostrar un comentario oculto
- **THEN** el comentario reaparece en el detalle público del producto

#### Scenario: Eliminar un comentario

- **WHEN** el administrador confirma la eliminación de un comentario
- **THEN** el comentario se elimina y deja de existir tanto en el panel como en el detalle público

#### Scenario: Rol insuficiente

- **WHEN** un usuario con rol CLIENTE intenta ocultar, mostrar o eliminar un comentario
- **THEN** el backend responde 403
