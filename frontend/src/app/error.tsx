'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="Algo salió mal"
      description="Ocurrió un problema inesperado. Intenta de nuevo; si continúa, vuelve al inicio."
      backHref="/"
      backLabel="Ir al inicio"
    />
  );
}
