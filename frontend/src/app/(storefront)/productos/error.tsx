'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="No pudimos cargar el catálogo"
      description="Revisa tu conexión e intenta de nuevo."
      backHref="/"
      backLabel="Ir al inicio"
    />
  );
}
