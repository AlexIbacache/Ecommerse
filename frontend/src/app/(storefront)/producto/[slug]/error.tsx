'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="No pudimos cargar el producto"
      description="Puede ser un problema temporal. Intenta de nuevo o vuelve al catálogo."
      backHref="/productos"
      backLabel="Ver catálogo"
    />
  );
}
