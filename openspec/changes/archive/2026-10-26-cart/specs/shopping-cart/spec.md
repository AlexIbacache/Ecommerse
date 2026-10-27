# Spec Delta

## Purpose

Define el carrito de compras del cliente: gestión de ítems con estado global en Zustand y feedback inmediato, más la validación del carrito en el backend antes de iniciar una compra.

## ADDED Requirements

### Requirement: Gestión del carrito con estado global

El carrito SHALL administrarse con Zustand y permitir: agregar productos, eliminar productos, modificar cantidades y vaciar el carrito, mostrando precio unitario, subtotal por ítem y total. La interfaz SHALL reflejar cada cambio de inmediato.

#### Scenario: Agregar un producto

- **WHEN** el cliente agrega un producto desde el detalle
- **THEN** el ítem aparece en el carrito con su cantidad y el total se actualiza inmediatamente, con feedback visual (toast o badge)

#### Scenario: Modificar cantidad

- **WHEN** el cliente aumenta o reduce la cantidad de un ítem
- **THEN** subtotal y total se recalculan al instante en la interfaz

#### Scenario: Eliminar un producto

- **WHEN** el cliente elimina un ítem del carrito
- **THEN** el ítem desaparece y el total se actualiza de inmediato

### Requirement: Persistencia local del carrito

El carrito SHALL conservar su contenido ante recargas de página del navegador, sin que ello reemplace la validación del backend antes de comprar.

#### Scenario: Recarga con carrito activo

- **WHEN** el cliente recarga la página con ítems en el carrito
- **THEN** el carrito muestra los mismos ítems y cantidades

### Requirement: Límite de cantidad por disponibilidad

El sistema SHALL impedir seleccionar una cantidad mayor al stock disponible del producto.

#### Scenario: Cantidad superior al stock

- **WHEN** el cliente intenta llevar la cantidad de un ítem por encima del stock disponible
- **THEN** la interfaz impide el incremento y comunica el límite disponible

### Requirement: Validación del carrito en el backend

Antes del checkout, el backend SHALL validar el contenido del carrito contra la base de datos y devolver para cada ítem el precio vigente y el stock real, señalando ítems inactivos, sin stock suficiente o con precio modificado. Los importes enviados por el cliente SHALL ignorarse como fuente de verdad.

#### Scenario: Carrito válido

- **WHEN** se envía al backend un carrito cuyos productos están activos y con stock suficiente
- **THEN** el backend devuelve los precios vigentes y confirma la validez de cada ítem

#### Scenario: Precio modificado desde que se agregó

- **WHEN** el precio de un producto cambió después de agregarlo al carrito
- **THEN** la validación devuelve el precio vigente marcando la diferencia, y la interfaz actualiza el importe mostrado

#### Scenario: Stock insuficiente o producto inactivo

- **WHEN** un ítem del carrito ya no tiene stock suficiente o el producto fue desactivado
- **THEN** la validación marca ese ítem con el motivo y la interfaz lo comunica pidiendo ajustar la cantidad o quitar el ítem
