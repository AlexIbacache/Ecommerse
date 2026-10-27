# Proposal

## Why

El documento exige un panel administrativo independiente con un dashboard que muestre información relevante de la tienda —total de productos, total de ventas, ingresos registrados, pedidos recientes, productos con bajo stock y distribución de pedidos por estado— con datos reales provenientes del backend.

## What Changes

- Backend: endpoint de métricas del dashboard (solo ADMINISTRADOR) calculado con agregaciones reales sobre la base de datos.
- Frontend: estructura del panel administrativo (layout propio con navegación) y página de dashboard con tarjetas de métricas, pedidos recientes, productos con bajo stock y distribución de pedidos por estado, con skeletons y estados de error.

## Capabilities

### New Capabilities

- `admin-metrics`: métricas reales de la tienda para el panel administrativo — totales de productos y ventas, ingresos, pedidos recientes, bajo stock y distribución por estado, accesibles solo para administradores.

### Modified Capabilities

(sin cambios)

## Impact

- Código: módulo `admin` (métricas) en el backend; layout y página dashboard del panel en el frontend.
- Dependencias: `auth-and-rbac` (guard de rol admin), `checkout-paypal` (ventas e ingresos reales), `catalog-api` (productos y stock).
- Sistemas: primera pieza del panel; la siguen `admin-products` y `admin-orders-comments`.
