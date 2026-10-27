# Proposal

## Why

El documento exige un perfil de cliente (sin necesidad de ser elaborado) que permita visualizar los datos de la cuenta, modificar información básica, consultar el historial de compras y ver el detalle de cada pedido. Los pedidos ya existen desde `checkout-paypal`; falta la experiencia de cuenta del cliente.

## What Changes

- Backend: endpoints de cuenta para consultar y actualizar la información básica del perfil propio (nombre, email con control de unicidad), con validación Zod.
- Frontend: sección de cuenta con datos del perfil, edición con validación y feedback, historial de compras con estado de cada pedido y página de detalle de pedido con ítems, totales y estado del pago.

## Capabilities

### New Capabilities

- `customer-account`: gestión de la cuenta del cliente — consulta y edición de información básica del perfil, historial de compras y detalle de pedidos propios.

### Modified Capabilities

(sin cambios)

## Impact

- Código: endpoints de perfil en el módulo `users` del backend; rutas `(cuenta)` en el frontend.
- Dependencias: `auth-and-rbac` (sesión y ownership), `checkout-paypal` (pedidos a mostrar).
- Sistemas: completa el recorrido del cliente del flujo de compra.
