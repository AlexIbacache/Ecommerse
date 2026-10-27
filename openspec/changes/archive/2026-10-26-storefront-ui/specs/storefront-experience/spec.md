# Spec Delta

## Purpose

Define la experiencia pública de la tienda: navegación del catálogo con todos sus controles, detalle de producto, estados de interfaz con feedback claro, identidad visual consistente y adaptación responsive real.

## ADDED Requirements

### Requirement: Navegación del catálogo sincronizada con la URL

La tienda SHALL permitir buscar, filtrar por categoría, ordenar y paginar el catálogo desde la interfaz, reflejando el estado de los controles en la URL para que las vistas sean compartibles.

#### Scenario: Aplicar filtros desde la interfaz

- **WHEN** un visitante escribe en la búsqueda, selecciona una categoría o cambia el orden
- **THEN** el listado se actualiza con los resultados del backend y la URL refleja los criterios aplicados

#### Scenario: Vista compartible

- **WHEN** un visitante abre una URL del catálogo que ya contiene criterios de búsqueda/filtro/orden/página
- **THEN** la interfaz muestra esos controles aplicados y los resultados correspondientes

### Requirement: Página de detalle de producto completa

Cada producto SHALL tener una página de detalle con nombre, galería de imágenes, descripción, precio, categoría, disponibilidad, selector de cantidad limitado por el stock y acción de agregar al carrito, con presentación profesional y jerarquía visual clara.

#### Scenario: Detalle completo

- **WHEN** un visitante abre la página de un producto disponible
- **THEN** ve todos los campos anteriores y puede seleccionar cantidad y agregar al carrito

#### Scenario: Producto sin stock

- **WHEN** un visitante abre la página de un producto sin stock
- **THEN** la disponibilidad se comunica con claridad y la acción de agregar al carrito no está disponible

### Requirement: Estados de interfaz y feedback

Las funcionalidades de la tienda SHALL manejar estados de carga (skeletons), vacío, error y éxito, de modo que el usuario siempre sepa qué está ocurriendo.

#### Scenario: Carga del catálogo

- **WHEN** el listado está esperando la respuesta del backend
- **THEN** se muestran skeletons en lugar de un salto de contenido o una página en blanco

#### Scenario: Búsqueda sin resultados

- **WHEN** una búsqueda o filtro no devuelve productos
- **THEN** se muestra un empty state claro con una acción para restablecer los filtros

#### Scenario: Error de comunicación

- **WHEN** el backend no responde o devuelve un error
- **THEN** se muestra un error state con opción de reintentar, sin datos corruptos ni pantalla rota

### Requirement: Identidad visual consistente

La aplicación SHALL presentar una identidad visual propia y coherente: paleta de colores consistente, tipografía definida, componentes bien diseñados y animaciones/transiciones suaves con Motion que aporten valor sin perjudicar la usabilidad.

#### Scenario: Consistencia entre páginas

- **WHEN** se navega entre home, catálogo y detalle
- **THEN** la paleta, tipografía, espaciados y lenguaje de componentes se mantienen consistentes, sin apariencia de plantilla genérica

#### Scenario: Animaciones no intrusivas

- **WHEN** se producen transiciones entre vistas o aparecen elementos
- **THEN** las animaciones son suaves y no bloquean ni retrasan la interacción del usuario

### Requirement: Adaptación responsive real

La tienda SHALL funcionar correctamente en desktop, tablet y mobile, adaptando la experiencia (navegación, grillas, controles) y no solo reduciendo tamaños ni permitiendo overflow.

#### Scenario: Catálogo en mobile

- **WHEN** un visitante usa el catálogo en un viewport de 360px
- **THEN** la navegación, los filtros y las tarjetas de producto son usables sin scroll horizontal

#### Scenario: Detalle en tablet

- **WHEN** un visitante abre el detalle de producto en un viewport intermedio (~768px)
- **THEN** la galería, la información y las acciones se reorganizan de forma usable y legible
