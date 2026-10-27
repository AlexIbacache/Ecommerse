# Design

## Context

Consume el carrito validado de `cart` y la autenticación de `auth-and-rbac`. Ver `proposal.md` — Why. Principio rector: el estado del dinero lo decide el backend tras hablar con PayPal; todo lo demás (botones, callbacks del SDK, redirects) es una sugerencia.

## Goals / Non-Goals

**Goals:**

- Consistencia fuerte PayPal ↔ pago ↔ pedido ↔ stock, verificada server-side.
- Idempotencia total ante reintentos, recargas y doble click.
- Manejo explícito de los seis resultados: completado, rechazado, cancelado, error de comunicación, duplicado, pendiente.

**Non-Goals:**

- Webhooks de PayPal (en Sandbox con contenedores locales el flujo de retorno del comprador es la vía de confirmación; la consulta de estado del pedido cubre los pendientes).
- Reembolsos.
- Múltiples monedas o pasarelas.

## Decisions

- **Flujo server-side con Orders API v2 (Sandbox)**: `POST /orders` (backend) → botón PayPal JS SDK con ese `orderId` → `onApprove` → `POST /payments/capture` (backend) que ejecuta `GET order` + `POST capture` contra PayPal y verifica `status === "COMPLETED"` y `purchase_units[0].amount.value === total del pedido`. Alternativa: captura desde el SDK en el cliente — descartada, viola el requisito de verificación server-side.
- **Creación del pedido en dos fases**: (1) `POST /orders` crea el pedido PENDIENTE_PAGO recalculando todo desde la DB y validando stock (sin descontar); (2) `POST /orders/:id/paypal` crea la orden en PayPal con ese total. El frontend jamás envía montos.
- **Confirmación transaccional**: en una sola transacción Prisma: verificar que el pedido sigue PENDIENTE_PAGO, descontar cada ítem con `UPDATE products SET stock = stock - q WHERE id = ? AND stock >= q` (0 filas afectadas = conflicto → rollback total y PAGO_FALLIDO), marcar pago COMPLETADA y pedido PAGADO. Decisión confirmada: el stock se descuenta al confirmarse el pago, no al crear la orden.
- **Idempotencia**: `payments.paypal_order_id UNIQUE`. El endpoint de captura busca primero si ese `paypal_order_id` ya fue procesado y devuelve el resultado existente (misma respuesta, sin efectos). Las carreras se resuelven por la constraint única.
- **Estados no exitosos**: cancelación → CANCELADO (lo informa el retorno del SDK); rechazo/denegación de PayPal → PAGO_FALLIDO; error de red/5xx con PayPal → el pedido queda PENDIENTE_PAGO, se registra el error y se responde 502 para que el cliente reintente; cierre de ventana sin acción → PENDIENTE_PAGO, con endpoint de consulta de estado (`GET /orders/:id`) que el frontend usa al volver.
- **Reconciliación de pendientes**: `GET /orders/:id` consulta el estado en PayPal si el pedido sigue PENDIENTE_PAGO y tiene `paypal_order_id`, actualizando el estado si PayPal ya lo resolvió. Evita pedidos colgados tras un corte justo después de la aprobación.
- **Registro de auditoría**: `payments.raw_payload` (JSONB) guarda la respuesta de captura/verificación de PayPal para la revisión de inconsistencias.
- **Cliente HTTP de PayPal** con credenciales solo en backend (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`), token OAuth cacheado con expiración, timeouts y reintentos acotados. Al frontend solo llega `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.

## Risks / Trade-offs

- [Doble submit del botón de pago] → idempotencia por `paypal_order_id` + botón deshabilitado tras el primer click.
- [Stock vendido dos veces en concurrencia] → decremento atómico con condición `stock >= qty` dentro de la transacción; el perdedor obtiene PAGO_FALLIDO (en Sandbox se documenta como caso límite; en producción se reembolsaría).
- [Pago aprobado pero pedido colgado por caída justo después del onApprove] → reconciliación en `GET /orders/:id` contra PayPal.
- [Verificación añade latencia al checkout] → aceptable; el costo de NO verificar es vender con importes manipulados.
- [Secrets de PayPal filtrados] → solo en `.env` del backend (no versionado); `.env.example` con placeholders; frontend solo recibe client-id.

## Migration Plan

N/A — funcionalidad nueva. Requiere agregar variables `PAYPAL_*` al `.env` (documentadas en `.env.example` y en la guía de `docs/`).

## Open Questions

Ninguna.
