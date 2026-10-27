# Tasks

> Completado (2026-10-26): 8/8 tareas verificadas. Auditoría de seguridad con requests reales:
> 401 sin sesión, 403 para cliente en admin, 404 en recursos ajenos, 401 con token manipulado,
> 400 con Zod y sin stack traces, 429 por rate limiting, CORS estricto (se corrigió para no
> responder con el origen permitido a orígenes ajenos) y headers de helmet. Credenciales PayPal
> validadas contra el Sandbox real (token OAuth 200) y secret ausente del frontend. Documentación
> completa (README + docs/paypal-sandbox.md + .env.example). Prueba desde cero: `down -v` +
> `up --build` → migraciones y seed automáticos, health 200, login admin 200, frontend 200.
> Se corrigió el build para ejecutar `prisma generate` (faltaba y rompía el seed en entorno limpio).
> Tests 81/81 backend + 5/5 frontend.

## 1. Auditoría de seguridad

- [x] 1.1 Recorrer todos los endpoints verificando autenticación, rol y ownership con requests manipuladas (IDs ajenos, token de cliente en rutas admin, importes alterados, captura duplicada); documentar y corregir cualquier hallazgo, verificando que cada corrección cierra el caso
- [x] 1.2 Verificar configuración de seguridad transversal: CORS estricto, rate limiting activo, errores sin stack traces, secrets solo en backend y headers de seguridad; verificar cada punto con una request concreta

## 2. Verificación funcional y visual

- [x] 2.1 Ejecutar el checklist del punto 12 del documento de requisitos íntegro (flujos, persistencia, roles, carrito, checkout Sandbox, ventas en panel, formularios) y dejar evidencia de cada ítem verificado
- [x] 2.2 Recorrer todas las pantallas en 360px, 768px y 1280px y con la consola abierta; verificar responsive real y consola sin errores

## 3. Documentación de entrega

- [x] 3.1 Completar el README final (arquitectura, requisitos previos, levantado, credenciales demo, scripts, estructura) y verificar que cada comando documentado funciona tal cual
- [x] 3.2 Revisar `.env.example` definitivo con placeholders y sin credenciales reales; verificar el repositorio versionado completo en busca de secretos filtrados
- [x] 3.3 Escribir `docs/paypal-sandbox.md` con la guía paso a paso (crear app Sandbox, obtener credenciales, cuentas de prueba de comprador) y verificarla siguiéndola con una app Sandbox nueva

## 4. Verificación de entrega desde cero

- [x] 4.1 En un entorno limpio (repo recién clonado, volúmenes Docker eliminados), seguir únicamente el README; verificar levantado de los tres contenedores, migraciones, seed y operación básica de tienda y panel
