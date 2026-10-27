# Spec Delta

## Purpose

Cubre el ciclo de vida de la cuenta y la sesión del usuario: registro, autenticación, mantenimiento y cierre de sesión, con manejo seguro de credenciales y defensa contra abuso.

## ADDED Requirements

### Requirement: Registro de cuentas de cliente

El sistema SHALL permitir crear cuentas con email y contraseña, validando formato de email, longitud mínima de contraseña y unicidad del email. Toda cuenta creada por este medio SHALL recibir el rol CLIENTE, y la contraseña SHALL almacenarse únicamente como hash argon2id.

#### Scenario: Registro exitoso

- **WHEN** un visitante envía nombre, email válido y contraseña que cumple las reglas
- **THEN** se crea la cuenta con rol CLIENTE y la contraseña queda almacenada como hash, nunca en texto plano

#### Scenario: Email duplicado

- **WHEN** se intenta registrar un email ya existente
- **THEN** el backend responde 409 sin revelar información adicional de la cuenta existente

#### Scenario: Datos inválidos

- **WHEN** se envía un email con formato inválido o una contraseña que no cumple la longitud mínima
- **THEN** el backend responde 400 con los errores de validación por campo

### Requirement: Inicio de sesión y emisión de tokens

El sistema SHALL autenticar credenciales válidas emitiendo un JWT de corta duración (15 minutos) y un refresh token, ambos entregados en cookies `httpOnly`, `Secure` y `SameSite=Lax`. Las credenciales inválidas SHALL rechazarse con un 401 genérico que no distinga entre email inexistente y contraseña incorrecta.

#### Scenario: Login exitoso

- **WHEN** un usuario envía email y contraseña válidos
- **THEN** recibe las cookies de sesión y puede consultar su perfil autenticado

#### Scenario: Credenciales inválidas

- **WHEN** se envía un email inexistente o una contraseña incorrecta
- **THEN** el backend responde 401 con el mismo mensaje genérico en ambos casos

### Requirement: Mantenimiento y cierre de sesión

El sistema SHALL mantener la sesión del usuario entre recargas mediante el refresh token, rotarlo en cada uso y revocarlo al cerrar sesión.

#### Scenario: Sesión persistente tras recarga

- **WHEN** un usuario autenticado recarga la aplicación
- **THEN** su sesión sigue activa sin necesidad de volver a ingresar credenciales

#### Scenario: Refresh token rotado

- **WHEN** el access token expira y el cliente usa el refresh token
- **THEN** recibe un nuevo par de tokens y el refresh token anterior queda invalidado

#### Scenario: Logout

- **WHEN** el usuario cierra sesión
- **THEN** el refresh token queda revocado y las cookies se eliminan; peticiones posteriores a endpoints protegidos responden 401

### Requirement: Defensa anti-abuso en autenticación

Los endpoints de autenticación SHALL aplicar rate limiting por IP para frenar fuerza bruta y enumeración.

#### Scenario: Demasiados intentos de login

- **WHEN** desde una misma IP se superan los intentos permitidos en la ventana de tiempo configurada
- **THEN** el backend responde 429 sin procesar las credenciales adicionales
