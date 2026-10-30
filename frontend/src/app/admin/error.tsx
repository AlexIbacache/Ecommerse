'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="No pudimos cargar el panel"
      description="Intenta de nuevo. Si continúa, revisa que el servidor esté disponible."
      backHref="/admin"
      backLabel="Volver al dashboard"
    />
  );
}
