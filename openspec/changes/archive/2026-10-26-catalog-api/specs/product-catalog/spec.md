# Spec Delta

## Purpose

Expone el catálogo de la tienda a cualquier visitante: listado de productos con búsqueda, filtros, orden y paginación, detalle de producto y listado de categorías, siempre desde la base de datos.

## ADDED Requirements

### Requirement: Listado público de productos

El sistema SHALL ofrecer un listado público (sin autenticación) de productos activos que incluya para cada uno: nombre, slug, precio, imagen principal, categoría y disponibilidad.

#### Scenario: Visitante consulta el catálogo

- **WHEN** un visitante sin sesión solicita el listado de productos
- **THEN** recibe la página solicitada con los productos activos y la metadata de paginación

#### Scenario: Productos inactivos ocultos

- **WHEN** un producto está marcado como no disponible/inactivo
- **THEN** no aparece en el listado público

### Requirement: Búsqueda, filtrado, ordenamiento y paginación

El listado SHALL soportar: búsqueda por nombre (parcial, insensible a mayúsculas), filtro por categoría, ordenamiento por precio (ascendente/descendente), nombre y fecha de creación, y paginación con `page`, `pageSize` y total de resultados. Los criterios SHALL ser combinables entre sí.

#### Scenario: Búsqueda por nombre

- **WHEN** se solicita el listado con un término de búsqueda
- **THEN** solo se devuelven productos activos cuyo nombre coincide parcialmente con el término

#### Scenario: Filtro y orden combinados

- **WHEN** se solicita el listado filtrado por una categoría y ordenado por precio ascendente
- **THEN** todos los resultados pertenecen a esa categoría y están ordenados por precio de menor a mayor

#### Scenario: Paginación consistente

- **WHEN** se solicita la página 2 con un tamaño de página dado
- **THEN** se devuelven los resultados correspondientes a esa página junto con total de ítems y total de páginas

### Requirement: Validación de parámetros de consulta

Los parámetros de consulta SHALL validarse en el backend con un tamaño de página máximo y una lista cerrada de campos de ordenamiento.

#### Scenario: Parámetros inválidos

- **WHEN** se solicita el listado con un campo de ordenamiento no permitido o un tamaño de página que excede el máximo
- **THEN** el backend responde 400 indicando el parámetro inválido

### Requirement: Detalle público de producto

El sistema SHALL ofrecer el detalle de un producto por su slug, incluyendo nombre, descripción, precio, categoría, todas sus imágenes, stock y disponibilidad.

#### Scenario: Detalle existente

- **WHEN** se solicita el detalle de un slug válido de un producto activo
- **THEN** se devuelven todos los campos del producto incluyendo sus imágenes ordenadas

#### Scenario: Slug inexistente o producto inactivo

- **WHEN** se solicita el detalle de un slug inexistente o de un producto inactivo
- **THEN** el backend responde 404

### Requirement: Listado público de categorías

El sistema SHALL ofrecer el listado de categorías para poblar los filtros del catálogo.

#### Scenario: Categorías disponibles

- **WHEN** un visitante solicita las categorías
- **THEN** recibe la lista completa con nombre y slug de cada una
