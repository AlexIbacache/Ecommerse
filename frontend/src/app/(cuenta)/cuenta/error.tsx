'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="No pudimos cargar tu cuenta"
      description="Intenta de nuevo. Si el problema continúa, vuelve a iniciar sesión."
      backHref="/login"
      backLabel="Iniciar sesión"
    />
  );
}
