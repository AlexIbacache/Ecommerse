# Design

## Context

Consume `catalog-api`. Ver `proposal.md` — Why. La rúbrica da 30% al diseño/UX: este documento fija las decisiones visuales para que el resultado tenga identidad propia y no parezca una plantilla genérica.

## Goals / Non-Goals

**Goals:**

- Sistema de diseño con identidad reconocible (paleta + tipografía + ritmo de espaciado).
- Catálogo y detalle con jerarquía clara y estados completos.
- Responsive real: layouts que se reorganizan, no solo se achican.

**Non-Goals:**

- Modo oscuro (no requerido).
- Internacionalización (UI solo en español).
- Gráficos avanzados o animaciones complejas de scroll (bonus, fuera de scope).

## Decisions

- **Sistema de diseño basado en tokens**: paleta definida como variables CSS consumidas por Tailwind y shadcn/ui (un color de marca + escala de neutros + semánticos de éxito/error), tipografía display para títulos y sans para cuerpo (Google Fonts auto-hospedadas por Next/font). Las decisiones concretas de color/tipografía se toman en la implementación y quedan plasmadas en los tokens; lo importante es que TODO componente consume tokens, nunca valores sueltos.
- **shadcn/ui como base de componentes, personalizada**: se sobreescriben los tokens del tema (radius, colores, sombras) para alejarse del look por defecto.
- **Server Components para el catálogo** (fetch por URL/searchParams → SEO y velocidad) y **Client Components solo donde hay interactividad** (selector de cantidad, botón carrito, controles de filtro). El estado de los controles vive en la URL (`searchParams`), no en Zustand.
- **Motion con propósito**: transiciones de entrada de tarjetas (stagger leve), layout animations en el carrito, transición entre vistas del detalle. Duraciones cortas (150–300 ms), sin animaciones que bloqueen.
- **Responsive mobile-first con breakpoints de Tailwind**: navegación de escritorio → menú móvil (sheet/drawer), grilla de productos 1/2/3/4 columnas según viewport, detalle que apila galería e información en mobile.
- **Estrategia de estados**: cada ruta con `loading.tsx` (skeletons), manejo de errores con `error.tsx` y empty states explícitos por componente; toasts para acciones del usuario.

## Risks / Trade-offs

- [Riesgo de look genérico de shadcn/ui] → personalización de tokens + componentes compuestos propios para tarjetas y galería.
- [Fetch en Server Components sin cookies personalizadas para endpoints públicos] → la API de catálogo es pública; no hace falta reenvío de cookies aquí.
- [Animaciones excesivas dañan usabilidad] → Motion limitado a micro-transiciones; ninguna animación en el camino crítico de compra.
