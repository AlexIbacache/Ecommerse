'use client';

import { RouteError } from '@/components/route-error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <RouteError
      reset={reset}
      title="No pudimos continuar con tu compra"
      description="Si ya iniciaste un pago, tu pedido no se perdió: revísalo en Mi cuenta antes de volver a pagar."
      backHref="/cuenta"
      backLabel="Ir a Mi cuenta"
    />
  );
}
