# delivery-readiness Specification

## Purpose
Define las condiciones verificables que el proyecto debe cumplir antes de la entrega: seguridad revisada, flujos principales funcionando, documentación completa y ejecución desde cero reproducible.

## Requirements

### Requirement: Revisión integral de seguridad y flujos

Antes de la entrega SHALL verificarse de forma explícita: que los flujos principales funcionan de punta a punta, que los datos persisten correctamente, que roles y permisos están protegidos en el backend (incluyendo intentos con identificadores ajenos y operaciones fuera del flujo normal), que el carrito opera correctamente y que el checkout con PayPal Sandbox se completa y se refleja en el panel administrativo.

#### Scenario: Checklist de seguridad superado

- **WHEN** se ejecuta la revisión de seguridad probando requests manipuladas (IDs ajenos, roles insuficientes, importes alterados, operaciones duplicadas de pago)
- **THEN** todas las solicitudes indebidas son rechazadas por el backend y no se registra ninguna inconsistencia

#### Scenario: Flujo de compra completo

- **WHEN** se realiza una compra completa con PayPal Sandbox desde el catálogo hasta el panel administrativo
- **THEN** el pedido se registra con su pago verificado, aparece en el perfil del cliente y en las ventas del administrador

### Requirement: Calidad de las pantallas principales

Las pantallas principales SHALL funcionar sin errores evidentes en consola, con formularios que manejan errores correctamente y con comportamiento responsive verificado en desktop, tablet y mobile.

#### Scenario: Consola limpia

- **WHEN** se recorren catálogo, detalle, carrito, checkout, cuenta y panel administrativo
- **THEN** no aparecen errores en la consola del navegador

#### Scenario: Responsive verificado

- **WHEN** se recorren las mismas pantallas en viewports de 360px, 768px y 1280px
- **THEN** todas son usables, sin overflow y con layouts adaptados al dispositivo

### Requirement: Documentación de entrega completa

El proyecto SHALL incluir: README completo, variables de entorno de ejemplo sin credenciales reales, instrucciones para configurar PayPal Sandbox, credenciales de demostración de los roles cliente y administrador (cuentas de prueba) y los archivos de infraestructura necesarios (Docker Compose, Dockerfiles, esquema y migraciones, datos de prueba).

#### Scenario: Ejecución desde cero siguiendo el README

- **WHEN** una persona sin contexto previo sigue el README en un entorno limpio (incluyendo la configuración de PayPal Sandbox con sus propias credenciales de prueba)
- **THEN** logra levantar los tres contenedores, cargar los datos de prueba y operar la tienda y el panel con las credenciales demo

#### Scenario: Sin credenciales reales en el repositorio

- **WHEN** se revisa el contenido versionado del repositorio
- **THEN** no aparecen credenciales reales, solo placeholders en `.env.example`
