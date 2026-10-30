'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RouteError({
  reset,
  title,
  description,
  backHref = '/',
  backLabel = 'Ir al inicio',
}: {
  reset: () => void;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div role="alert" className="container-page py-24 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="mt-2 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
