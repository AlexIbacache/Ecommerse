# Tasks

> Completado (2026-10-26): 7/7 tareas verificadas. Store de carrito con Zustand + persistencia
> (add/remove/setQuantity/syncItems/clear, total y count), límite por stock; página de carrito con
> ítems, cantidades, eliminación con diálogo de confirmación, subtotales/total, empty state y
> validación server-side (`POST /cart/validate`) que detecta precio cambiado, stock insuficiente,
> producto inactivo e inexistente. Backend 38/38 tests (5 suites); frontend 5/5 tests del store.
> Evidencia visual: carrito con 2 unidades, badge en header y total $259.98; consola sin errores
> propios (solo el 401 esperado de `/auth/me`).

## 1. Store de carrito (frontend)

- [x] 1.1 Crear el store de carrito con Zustand (agregar, eliminar, modificar cantidad, vaciar) con persistencia local y derivación de subtotales/total; verificar con tests unitarios del store que cada acción actualiza ítems y totales correctamente
- [x] 1.2 Implementar el límite de cantidad por stock en el store/selectores; verificar con test unitario que no se puede superar el stock

## 2. Interfaz de carrito

- [x] 2.1 Implementar la página/panel de carrito con líneas de ítem, selectores de cantidad, eliminación con confirmación, subtotales, total y empty state con llamado a seguir explorando; verificar feedback inmediato en cada operación
- [x] 2.2 Integrar el badge/contador del carrito en el header y los toasts de "agregado al carrito"; verificar que se actualizan al instante
- [x] 2.3 Verificar la vista del carrito en 360px, 768px y 1280px (usable, sin overflow)

## 3. Validación server-side (backend)

- [x] 3.1 Implementar el endpoint de validación de carrito (recibe ítems con cantidades, devuelve precio vigente, stock real e ítems problemáticos con motivo); verificar con tests de integración los casos: válido, precio modificado, stock insuficiente y producto inactivo
- [x] 3.2 Conectar la página de carrito con la validación al entrar al flujo de compra; verificar que la interfaz refleja precios actualizados y bloquea ítems con problemas antes de continuar
