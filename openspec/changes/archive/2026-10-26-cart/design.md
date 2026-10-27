# Design

## Context

Extiende `storefront-ui` y consume `catalog-api`. Ver `proposal.md` — Why. El carrito es el único estado de negocio que vive en el cliente; por eso su contrato con el backend es deliberadamente desconfiado.

## Goals / Non-Goals

**Goals:**

- UI del carrito instantánea (sin roundtrips por cada cambio).
- El backend siempre puede revalidar y corregir lo que el cliente cree tener.

**Non-Goals:**

- Carrito persistido en servidor / sincronizado entre dispositivos (no requerido).
- Reserva de stock al agregar al carrito (la reserva no existe: el stock se valida en checkout y se descuenta al confirmar el pago).

## Decisions

- **Zustand con middleware `persist` (localStorage)** para el carrito: sobrevive recargas sin backend. Es estado de UI, no de negocio — el documento prohíbe CRUD de negocio en LocalStorage, y esto no lo es: la compra real pasa por el backend sí o sí.
- **El store guarda `{ productId, slug, name, price, imageUrl, stock, quantity }`**: datos de exhibición + stock conocido para limitar cantidad en UI. El `price` guardado es solo display; jamás se envía como importe confiable.
- **Endpoint `POST /cart/validate`**: recibe `[{ productId, quantity }]`, devuelve por ítem `{ productId, price, stock, isActive, issue? }`. Se invoca al entrar al checkout y al volver a la página de carrito tras un tiempo; la UI corrige precios y marca ítems con problema. Alternativa: validar solo al crear la orden — descartada, el documento pide feedback claro antes de pagar.
- **Sin endpoint de "crear carrito" en el backend**: el carrito no se persiste server-side hasta convertirse en pedido (`checkout-paypal`).

## Risks / Trade-offs

- [Precios/stock mostrados pueden quedar stale en localStorage] → revalidación contra `/cart/validate` antes del checkout; la orden vuelve a validar al crearse.
- [Usuario manipula el store local] → inofensivo: solo empeora su propia UI; precios y stock reales siempre los decide el backend.
