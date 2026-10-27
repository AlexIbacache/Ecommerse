# Tasks

> Completado (2026-10-26): 10/10 tareas verificadas. Sistema de diseño propio (papel cálido,
> verde bosque, terracota, tipografía serif Fraunces + Inter), componentes shadcn/ui sobre
> Radix, header con menú móvil (Sheet), home con datos reales, catálogo con búsqueda/filtro/
> orden/paginación sincronizados con la URL, detalle con galería y panel de compra, skeletons,
> empty state, error state y 404. Animaciones con Motion en cards y secciones (150–300 ms).
> Evidencia visual (navegador): home, catálogo filtrado con selects con label y cards con
> badges, detalle completo; paginación 2 páginas con los 10 productos del seed. Consola: solo
> el 401 esperado de `/auth/me` en la hidratación anónima.

## 1. Sistema de diseño

- [x] 1.1 Definir tokens del tema (paleta de marca + neutros + semánticos, tipografías, radius, sombras) como variables CSS integradas con Tailwind y shadcn/ui; verificar que los componentes base reflejan la paleta propia y no la por defecto
- [x] 1.2 Instalar y personalizar los componentes shadcn/ui necesarios (button, input, select, card, badge, skeleton, toast, sheet, dialog, pagination); verificar que compilan y usan los tokens del tema

## 2. Estructura y navegación

- [x] 2.1 Implementar el layout de la tienda (header con navegación, buscador visible, acceso a carrito y cuenta; footer) con menú móvil tipo sheet; verificar navegación usable en 360px y en desktop

## 3. Catálogo

- [x] 3.1 Implementar la home con destacados y acceso al catálogo; verificar que carga datos reales del backend
- [x] 3.2 Implementar la página de catálogo con búsqueda, filtro por categoría, ordenamiento y paginación sincronizados con `searchParams`; verificar que la URL refleja los controles y que una URL con criterios restaura la vista
- [x] 3.3 Implementar skeletons de carga, empty state con acción de restablecer filtros y error state con reintento; verificar los tres estados forzándolos

## 4. Detalle de producto

- [x] 4.1 Implementar la página de detalle con galería de imágenes, precio, categoría, disponibilidad, descripción y selector de cantidad limitado por stock; verificar jerarquía visual y datos completos
- [x] 4.2 Implementar el estado sin stock (disponibilidad comunicada y acción de compra deshabilitada) y el 404 de producto; verificar ambos casos

## 5. Animaciones y responsive

- [x] 5.1 Aplicar transiciones con Motion (entrada de tarjetas, transiciones de vista) con duraciones de 150–300 ms; verificar que no bloquean la interacción
- [x] 5.2 Recorrer home, catálogo y detalle en viewports 360px, 768px y 1280px; verificar que no hay overflow y que los layouts se reorganizan de forma usable
