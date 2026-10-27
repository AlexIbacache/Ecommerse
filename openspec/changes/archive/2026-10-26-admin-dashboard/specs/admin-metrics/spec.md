# Spec Delta

## Purpose

Provee al administrador métricas reales de la tienda —totales, ingresos, pedidos recientes, bajo stock y distribución por estado— calculadas en el backend a partir de la base de datos.

## ADDED Requirements

### Requirement: Acceso exclusivo para administradores

Las métricas del panel SHALL ser accesibles únicamente para usuarios con rol ADMINISTRADOR.

#### Scenario: Administrador accede

- **WHEN** un usuario con rol ADMINISTRADOR solicita las métricas
- **THEN** el backend devuelve los datos agregados

#### Scenario: Cliente o visitante rechazado

- **WHEN** un usuario con rol CLIENTE o sin sesión solicita las métricas
- **THEN** el backend responde 403 o 401 respectivamente

### Requirement: Métricas generales de la tienda

El dashboard SHALL obtener del backend: total de productos, total de ventas (pedidos pagados) e ingresos registrados (suma de los totales de pedidos pagados), consistentes con lo almacenado en la base de datos.

#### Scenario: Métricas consistentes con la base de datos

- **WHEN** el administrador abre el dashboard tras registrarse ventas en Sandbox
- **THEN** total de ventas e ingresos reflejan exactamente los pedidos en estado PAGADO almacenados

### Requirement: Pedidos recientes y distribución por estado

El dashboard SHALL mostrar los pedidos más recientes (con cliente, fecha, total y estado) y la distribución de pedidos por estado (PENDIENTE_PAGO, PAGADO, PAGO_FALLIDO, CANCELADO).

#### Scenario: Pedidos recientes

- **WHEN** el administrador abre el dashboard
- **THEN** ve los últimos pedidos ordenados del más reciente al más antiguo con su información básica

#### Scenario: Distribución por estado

- **WHEN** existen pedidos en distintos estados
- **THEN** la distribución muestra el conteo correcto por cada estado

### Requirement: Productos con bajo stock

El dashboard SHALL mostrar los productos activos cuyo stock está por debajo de un umbral definido, para anticipar quiebres de stock.

#### Scenario: Productos bajo el umbral

- **WHEN** existen productos activos con stock por debajo del umbral
- **THEN** aparecen listados con su stock actual
