'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="No pudimos mostrar tu carrito"
      description="Tus productos siguen guardados en este dispositivo. Intenta de nuevo."
      backHref="/productos"
      backLabel="Seguir comprando"
    />
  );
}
