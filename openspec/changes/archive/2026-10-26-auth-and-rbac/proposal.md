# Proposal

## Why

El documento exige registro, inicio y cierre de sesión, sesión persistente y acceso por rol (CLIENTE y ADMINISTRADOR), con permisos protegidos desde el backend. La seguridad concentra el 30% de la evaluación y los revisores manipularán solicitudes HTTP e identificadores ajenos: la autenticación y la autorización deben ser sólidas desde su primera implementación.

## What Changes

- Backend: endpoints de autenticación (registro, login, logout, refresh, perfil `me`) con contraseñas hasheadas (argon2id) y validación Zod.
- Backend: emisión de JWT de corta duración en cookie `httpOnly; Secure; SameSite=Lax` y refresh token rotativo; guards de autenticación y de rol para NestJS.
- Backend: rate limiting en endpoints de autenticación y configuración estricta de CORS con credenciales.
- Frontend: páginas de login y registro con validación de formularios (Zod), estados de carga/error/éxito, manejo de sesión y protección de rutas de cuenta y administración.

## Capabilities

### New Capabilities

- `user-auth`: ciclo de vida de la cuenta y la sesión — registro, login, logout, refresh de tokens y consulta del perfil autenticado, con manejo seguro de credenciales y defensa anti-abuso.
- `access-control`: autorización en el backend por rol y por propietario del recurso, aplicada en cada operación protegida independientemente de la interfaz.

### Modified Capabilities

(sin cambios)

## Impact

- Código: nuevo módulo `auth` y `users` en el backend; guards y filtros comunes; páginas `(auth)` y store de sesión en el frontend.
- Dependencias: `@nestjs/jwt` (o `jose`), `argon2`, `@nestjs/throttler`, cookie parser.
- Sistemas: prerequisito de `comments` (comentarios autenticados), `checkout-paypal` (checkout requiere cuenta), `customer-profile` y todos los `admin-*`.
