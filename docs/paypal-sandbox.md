# Configurar PayPal Sandbox

Guía para habilitar el checkout con PayPal en entorno **Sandbox** (sin dinero real).

## 1. Cuenta de desarrollador

1. Ingresá a https://developer.paypal.com/dashboard/ con una cuenta PayPal (puede ser una cuenta de prueba).
2. Aceptá los términos del entorno Sandbox si es la primera vez.

## 2. Crear la app Sandbox y obtener credenciales

1. En el dashboard, abrí **Apps & Credentials** (a veces aparece como **Apps & Credentials → Sandbox**).
2. Creá una app nueva (por ejemplo `terral-demo`) o usá la **Default Application**.
3. Copiá:
   - **Client ID** → `PAYPAL_CLIENT_ID` y también `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
   - **Secret** → `PAYPAL_CLIENT_SECRET`.

> El **Client ID es público** (el navegador lo usa para cargar el SDK). El **Secret es privado** y solo lo usa el backend. Las "Sandbox accounts" (cuentas de prueba de comprador/vendedor) **no** son estas credenciales: se usan para iniciar sesión en la ventana de PayPal al pagar.

## 3. Completar el `.env`

En el `.env` de la raíz:

```bash
PAYPAL_CLIENT_ID=tu-client-id
PAYPAL_CLIENT_SECRET=tu-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu-client-id   # el MISMO Client ID
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

## 4. Recrear los contenedores

Los valores se leen al crear los contenedores (y el `NEXT_PUBLIC_*` al compilar el frontend):

```bash
docker compose up -d --force-recreate backend frontend
```

## 5. Crear (o usar) una cuenta de comprador de prueba

1. En el dashboard: **Testing Tools → Sandbox Accounts**.
2. Usá la cuenta **Personal** existente o creá una nueva.
3. Anotá su email y contraseña: los vas a usar **dentro de la ventana de PayPal** al pagar.

## 6. Probar el flujo completo

1. Ingresá a http://localhost:3000 con `cliente@demo.local` / `Cliente123!`.
2. Agregá productos al carrito y andá a **Continuar compra** → **Pagar con PayPal**.
3. Se abre la ventana de PayPal Sandbox: iniciá sesión con la cuenta de comprador de prueba y aprobá el pago.
4. La app verifica el pago **en el backend**, descuenta stock y muestra la página de resultado.
5. Verificá la venta en **Panel → Ventas** con `admin@demo.local` / `Admin123!`.

## Solución de problemas

- **502 al iniciar el pago**: credenciales incorrectas o ausentes. Verificá `PAYPAL_CLIENT_ID`/`SECRET` y que `PAYPAL_API_BASE` apunte al sandbox.
- **No aparece el botón de PayPal**: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` vacío o el frontend no se recreó después de cambiarlo. Recreá el servicio `frontend`.
- **El pago queda pendiente**: cerrá y volvé a abrir el pedido desde **Mi cuenta**; el backend reconcilia el estado real consultando PayPal al abrir el detalle.
- **"Sandbox accounts" no coinciden con el `.env`**: son cuentas distintas. Las del `.env` son las de la app (Client ID/Secret); las de "Sandbox accounts" son usuarios de prueba para pagar.
