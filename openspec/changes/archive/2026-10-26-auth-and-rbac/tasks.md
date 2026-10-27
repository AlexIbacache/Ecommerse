# Tasks

> Nota: ejecutar este change con el modelo de mayor capacidad disponible
> (auth concentra seguridad crítica). No usar modelos flash.

> Completado (2026-10-26): 13/13 tareas verificadas. Backend (NestJS) con argon2id, JWT de
> acceso (jose) + refresh token opaco rotativo (hash sha256 en tabla `Session`), cookies
> httpOnly, guards globales (Throttler, JwtAuth con @Public opt-out, RolesGuard), filtro global
> de errores, CORS estricto y rate limiting. Tests 22/22 en verde (Jest + ts-jest). Frontend con
> páginas /login y /registro, cliente HTTP con credentials, store de sesión (Zustand) y guardas
> de ruta para /cuenta y /admin. Evidencia: register 201 / dup 409 / inválido 400, login 200 con
> cookies httpOnly, me 200/401, refresh rota y revoca, ownership 404, logout 200, rate limit 429.

## 1. Módulo de autenticación (backend)

- [x] 1.1 Crear DTOs con validación Zod (registro, login) y el pipe de validación; verificar que payloads inválidos reciben 400 con errores por campo
- [x] 1.2 Implementar registro con hash argon2id y rol CLIENTE por defecto; verificar que la contraseña nunca se persiste en texto plano y que email duplicado devuelve 409
- [x] 1.3 Implementar login/logout/refresh con JWT de 15 min y refresh rotativo persistido (hash) en cookies httpOnly; verificar login válido, 401 genérico en credenciales inválidas, rotación de refresh y revocación en logout
- [x] 1.4 Implementar `GET /auth/me` que devuelve el perfil con su rol; verificar respuesta con token válido y 401 sin token

## 2. Autorización y endurecimiento (backend)

- [x] 2.1 Registrar `AuthGuard` global con decorador `@Public()` opt-out y `RolesGuard` con `@Roles()`; verificar 401 sin token, 401 con token manipulado y 403 con rol CLIENTE en endpoint admin
- [x] 2.2 Implementar helper de ownership para queries filtradas por `user_id` de sesión; verificar que pedir un recurso ajeno devuelve 404
- [x] 2.3 Configurar CORS (origen `FRONTEND_URL`, credentials) y rate limiting en `/auth/*`; verificar 429 tras superar intentos y rechazo de orígenes no configurados
- [x] 2.4 Implementar filtro global de excepciones con shape de error consistente y sin stack traces; verificar respuestas de error uniformes

## 3. Tests de seguridad (backend)

- [x] 3.1 Tests unitarios de guards y del helper de ownership; verificar cobertura de los casos de 401/403/404 anteriores
- [x] 3.2 Tests e2e de los flujos de autenticación (registro, login, refresh, logout, me) y del rate limiting; verificar que todos pasan

## 4. Autenticación (frontend)

- [x] 4.1 Crear páginas `/login` y `/registro` con formularios validados con Zod, estados de carga, errores de campo y toasts de éxito/error; verificar validación en cliente y manejo de errores del backend
- [x] 4.2 Crear el cliente HTTP con `credentials: 'include'` y el store de sesión (Zustand) hidratado desde `/auth/me`; verificar que la sesión persiste tras recargar
- [x] 4.3 Proteger las rutas `/cuenta` y `/admin` en el frontend (redirect a login si no hay sesión, a home si el rol no es admin); verificar los redireccionamientos y que el botón de logout cierra la sesión
