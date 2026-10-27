# data-model Specification

## Purpose
Define el modelo de datos relacional del e-commerce, sus garantías de integridad a nivel base de datos, la precisión monetaria y los datos de prueba iniciales reproducibles.

## Requirements

### Requirement: Esquema gestionado con migraciones versionadas

El esquema de la base de datos SHALL gestionarse mediante migraciones versionadas y reproducibles, capaces de crear desde cero las tablas: roles, users, categories, products, product_images, comments, orders, order_items y payments.

#### Scenario: Migración inicial sobre base de datos vacía

- **WHEN** se ejecutan las migraciones sobre una base de datos vacía
- **THEN** se crean las nueve tablas del dominio con sus columnas, claves primarias y relaciones

### Requirement: Integridad referencial y de dominio a nivel base de datos

La base de datos SHALL hacer cumplir: claves foráneas entre las entidades relacionadas; unicidad de `users.email`, `products.slug`, `categories.slug` y `payments.paypal_order_id`; y restricciones CHECK que impidan `stock` negativo, precios menores o iguales a cero y cantidades de ítem menores o iguales a cero.

#### Scenario: Email duplicado rechazado

- **WHEN** se intenta insertar un usuario con un email ya registrado
- **THEN** la base de datos rechaza la operación por violación de unicidad

#### Scenario: Stock negativo rechazado

- **WHEN** se intenta insertar o actualizar un producto con `stock` menor que cero
- **THEN** la base de datos rechaza la operación por violación de constraint

#### Scenario: Categoría con productos no puede eliminarse

- **WHEN** se intenta eliminar una categoría que tiene productos asociados
- **THEN** la base de datos rechaza la operación por la restricción de clave foránea

### Requirement: Precisión monetaria exacta

Los importes monetarios (precio de producto, precio unitario de ítem, total de pedido y monto de pago) SHALL almacenarse como `NUMERIC(10,2)` en una única moneda (USD), sin uso de tipos de punto flotante.

#### Scenario: Importes exactos sin error de redondeo

- **WHEN** se almacena y recupera un importe como `19.99` y otro como `0.01`
- **THEN** ambos valores se recuperan exactamente, sin error de representación de punto flotante

### Requirement: Snapshot de precios en los ítems de pedido

Cada ítem de pedido SHALL congelar el precio unitario del producto al momento de la compra (`unit_price`), de modo que los pedidos históricos no se vean afectados por cambios posteriores de precio.

#### Scenario: Cambio de precio no altera pedidos históricos

- **WHEN** se modifica el precio de un producto que ya figura en un pedido registrado
- **THEN** el detalle del pedido histórico conserva el `unit_price` vigente al momento de la compra

### Requirement: Datos de prueba reproducibles e idempotentes

El proyecto SHALL incluir un script de seed idempotente que cree: los roles CLIENTE y ADMINISTRADOR, un usuario administrador de demostración, un usuario cliente de demostración, al menos dos categorías y al menos ocho productos con imágenes por URL y stock variado (incluyendo al menos un producto con bajo stock y uno sin stock).

#### Scenario: Seed puebla la base de datos

- **WHEN** se ejecuta el seed sobre una base de datos migrada
- **THEN** existen los dos roles, ambos usuarios demo con su rol correcto, las categorías y los productos de prueba

#### Scenario: Seed es idempotente

- **WHEN** se ejecuta el seed por segunda vez sobre la misma base de datos
- **THEN** no se duplican roles, usuarios, categorías ni productos
