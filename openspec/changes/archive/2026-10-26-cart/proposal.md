# Proposal

## Why

El documento exige un carrito funcional administrado con Zustand donde el cliente agregue, elimine y modifique cantidades, vea subtotales y total, y continúe al checkout, con la interfaz reflejando los cambios de inmediato. Además, como el cliente no es confiable, el backend debe poder validar precios y stock reales del carrito antes de cualquier compra.

## What Changes

- Frontend: store de carrito con Zustand (agregar, eliminar, modificar cantidad, vaciar), persistencia local y cálculo de subtotales y total en la interfaz.
- Frontend: página/panel de carrito con feedback inmediato, estados vacío y confirmaciones para eliminar ítems.
- Backend: endpoint de validación de carrito que devuelve precios y stock actuales desde la base de datos, marcando ítems con problemas.

## Capabilities

### New Capabilities

- `shopping-cart`: gestión del carrito en el cliente con Zustand y feedback inmediato, más la validación server-side de precios y stock previa al checkout.

### Modified Capabilities

(sin cambios)

## Impact

- Código: `stores/cart` y componentes de carrito en el frontend; endpoint de validación en el módulo de productos/órdenes del backend.
- Dependencias: `storefront-ui` (agregar al carrito desde el detalle), `catalog-api` (datos de productos).
- Sistemas: prerequisito directo de `checkout-paypal`.
