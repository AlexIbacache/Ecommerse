# Design

## Context

Sobre el modelo `users`/`roles` de `database-schema-seed`. Ver `proposal.md` — Why. Los revisores van a manipular requests: cada decisión aquí asume que todo lo que llega del cliente es hostil.

## Goals / Non-Goals

**Goals:**

- Sesión segura contra XSS (token inaccesible a JS) y contra CSRF (SameSite + CORS estricto).
- Autorización declarativa y difícil de olvidar (guards globales por defecto).
- Verificación de ownership en la capa de servicio, no solo en el controller.

**Non-Goals:**

- Recuperación de contraseña (bonus, fuera de scope).
- OAuth / proveedores externos.
- 2FA.

## Decisions

- **JWT (15 min) + refresh token rotativo, ambos en cookies `httpOnly; Secure; SameSite=Lax`.** El token nunca es accesible desde JavaScript (mitiga robo por XSS). Alternativa: Bearer token en `Authorization` guardado en memoria/localStorage — descartada: localStorage es robable por XSS y la memoria pierde la sesión en cada recarga.
- **Refresh tokens persistidos (hash) en tabla de sesiones con rotación y revocación.** Permite logout real y detección de reutilización. Alternativa: refresh firmado stateless — no revocable sin lista negra.
- **argon2id para contraseñas.** Alternativa: bcrypt — aceptable, pero argon2id es la recomendación actual (resistente a GPU por memoria).
- **Guards globales en NestJS**: `AuthGuard` y `RolesGuard` registrados globalmente; los endpoints públicos se marcan con un decorador `@Public()`. Así la protección es opt-out y ningún endpoint queda expuesto por olvido. `@Roles(ADMINISTRADOR)` para rutas admin.
- **Ownership en el service**: las queries de recursos de usuario incluyen `userId` de la sesión en el `WHERE` (no verificación posterior en memoria). Recurso ajeno → `NotFoundException` (404, no 403) para no filtrar existencia.
- **Validación Zod en pipes** en cada DTO de entrada; los errores se devuelven con shape consistente `{ statusCode, message, errors }` sin stack traces (filtro global de excepciones).
- **CORS**: origen exacto del frontend (`FRONTEND_URL`), `credentials: true`, métodos explícitos. Sin comodines.
- **Rate limiting** con `@nestjs/throttler`: estricto en `/auth/*` (login/registro), moderado global.
- **Frontend**: cliente HTTP con `credentials: 'include'`; store de sesión en Zustand hidratado desde `GET /auth/me`; middleware/guards de ruta en App Router para `/cuenta` y `/admin` como UX (la seguridad real vive en la API).

## Risks / Trade-offs

- [Cookies cross-site entre `localhost:3000` y `localhost:4000`] → mismo sitio (ambos `localhost`), puertos distintos no afectan SameSite; CORS con credentials configurado explícitamente.
- [Refresh token robado y reutilizado] → rotación en cada uso + revocación en logout; la reutilización de un token ya rotado invalida la cadena.
- [Filtro de errores podría filtrar internals] → filtro global que mapea excepciones conocidas y devuelve 500 genérico sin stack en producción; logs internos con detalle.
- [Server Components no envían cookies automáticamente al backend] → el fetch desde RSC reenvía explícitamente la cookie de la request entrante.

## Open Questions

Ninguna.
