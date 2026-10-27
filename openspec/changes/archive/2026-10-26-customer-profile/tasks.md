# Tasks

> Completado (2026-10-26): 5/5 tareas verificadas. Backend: `GET /users/me`, `PATCH /users/me`
> (nombre/email con Zod, 409 si el email está en uso, rol de solo lectura — un `role` enviado se
> ignora) y ownership existente. Frontend: `/cuenta` con datos de la cuenta, formulario de edición
> validado y toasts, historial de compras con estado/fecha/total y empty state; `/cuenta/pedidos/[id]`
> con ítems, cantidades, precios del snapshot, total y estados de pedido/pago (404 para ajenos).
> Tests backend 66/66 (8 suites). Verificado en navegador: perfil editable, historial con pedido
> pendiente y detalle completo; sesión renovada automáticamente tras expirar el access token.

## 1. API de cuenta (backend)

- [x] 1.1 Implementar `GET /users/me` y `PATCH /users/me` (nombre, email) con validación Zod, unicidad de email (409) y rol intocable; verificar con tests los casos de éxito, email duplicado, payload inválido y campo `role` ignorado

## 2. Cuenta (frontend)

- [x] 2.1 Implementar la página de cuenta con los datos del perfil y formulario de edición validado con estados de guardado y toasts; verificar actualización, manejo de 409 y validación de campos
- [x] 2.2 Implementar el historial de compras con estado de pedido y pago, fecha y total, más empty state; verificar ambos casos
- [x] 2.3 Implementar la página de detalle de pedido con ítems, cantidades, precios snapshot, total, estado del pedido y del pago; verificar consistencia con lo registrado y el caso 404 de pedido ajeno
- [x] 2.4 Verificar la sección de cuenta en 360px, 768px y 1280px
