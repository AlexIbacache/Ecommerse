'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="mt-2 text-3xl font-normal tracking-[-0.02em]">No pudimos cargar el catálogo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Revisá la conexión e intentá de nuevo.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  );
}
