# product-comments Specification

## Purpose
Permite que visitantes anónimos y usuarios registrados comenten los productos, con validación del contenido, protección contra entradas maliciosas y abuso, y visualización en el detalle del producto.

## Requirements

### Requirement: Comentarios de usuarios registrados y anónimos

El sistema SHALL permitir comentar un producto tanto a usuarios autenticados (comentario asociado a su cuenta) como a visitantes anónimos (sin exigir cuenta, con un nombre visible obligatorio). Todo comentario SHALL quedar asociado al producto correspondiente.

#### Scenario: Comentario autenticado

- **WHEN** un usuario con sesión activa publica un comentario válido en un producto
- **THEN** el comentario queda asociado a su cuenta y al producto, y se muestra con su nombre de cuenta

#### Scenario: Comentario anónimo

- **WHEN** un visitante sin sesión publica un comentario válido indicando un nombre visible
- **THEN** el comentario queda asociado al producto sin cuenta de usuario y se muestra con el nombre indicado

#### Scenario: Anónimo sin nombre

- **WHEN** un visitante sin sesión intenta comentar sin indicar nombre visible
- **THEN** el backend responde 400 indicando el campo faltante

### Requirement: Validación y sanitización del contenido

El contenido de los comentarios SHALL validarse en el backend (longitud mínima y máxima razonables) y MUST tratarse como texto plano: cualquier HTML o script SHALL mostrarse como texto inerte, nunca ejecutarse.

#### Scenario: Contenido vacío o excedido

- **WHEN** se envía un comentario vacío o que supera la longitud máxima
- **THEN** el backend responde 400 con el error de validación correspondiente

#### Scenario: Intento de XSS

- **WHEN** un comentario contiene etiquetas script u otro HTML potencialmente malicioso
- **THEN** el contenido se almacena y renderiza como texto inerte, sin ejecución de código en el navegador

### Requirement: Prevención de abuso y spam

La creación de comentarios SHALL aplicar rate limiting (por IP para anónimos y por usuario para autenticados) para impedir ráfagas de publicación.

#### Scenario: Ráfaga de comentarios

- **WHEN** un mismo origen publica comentarios por encima del límite configurado en la ventana de tiempo
- **THEN** el backend responde 429 y no crea los comentarios adicionales

### Requirement: Listado de comentarios en el detalle del producto

El detalle de producto SHALL mostrar los comentarios visibles del producto, ordenados del más reciente al más antiguo, con paginación, indicando nombre del autor y fecha.

#### Scenario: Comentarios en el detalle

- **WHEN** un visitante abre el detalle de un producto con comentarios visibles
- **THEN** los ve listados del más reciente al más antiguo con autor y fecha

#### Scenario: Producto sin comentarios

- **WHEN** un visitante abre el detalle de un producto sin comentarios
- **THEN** se muestra un empty state invitando a dejar el primer comentario

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
