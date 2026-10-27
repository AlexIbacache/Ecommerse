# Proposal

## Why

El diseño y la experiencia de usuario concentran el 30% de la evaluación: el documento exige una tienda con identidad visual propia (no una plantilla genérica), buena jerarquía, animaciones con Motion y adaptación responsive real en desktop, tablet y mobile. Este change construye esa tienda pública sobre la API de catálogo.

## What Changes

- Definir el sistema de diseño: paleta de colores, tipografía, tokens de Tailwind y tema de shadcn/ui con identidad propia.
- Implementar la home y la página de catálogo con búsqueda, filtro por categoría, ordenamiento y paginación sincronizados con la URL.
- Implementar la página de detalle de producto con galería de imágenes, precio, disponibilidad, cantidad seleccionable y acción de agregar al carrito.
- Implementar estados de interfaz completos: skeletons de carga, empty states, error states con reintento y feedback con toasts; animaciones y transiciones con Motion.
- Garantizar la adaptación responsive real (navegación móvil, grillas adaptativas, sin overflow) en desktop, tablet y mobile.

## Capabilities

### New Capabilities

- `storefront-experience`: experiencia pública de la tienda — navegación del catálogo con todos sus controles, detalle de producto completo, estados de interfaz y feedback, identidad visual consistente y comportamiento responsive real.

### Modified Capabilities

(sin cambios)

## Impact

- Código: rutas `(storefront)` del App Router, componentes de tienda, tema de shadcn/ui, stores de UI.
- Dependencias: `catalog-api` (datos), Tailwind, shadcn/ui, Motion, Zustand.
- Sistemas: base visual sobre la que se montan `cart`, `comments`, `customer-profile` y el panel admin.
