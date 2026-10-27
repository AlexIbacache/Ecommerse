'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-semibold">No pudimos cargar el catálogo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Revisá la conexión e intentá de nuevo.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  );
}
