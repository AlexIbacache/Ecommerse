import { Skeleton } from '@/components/ui/skeleton';

function Status({ label }: { label: string }) {
  return (
    <span role="status" className="sr-only">
      {label}
    </span>
  );
}

/** Cabecera de página: eyebrow + título (+ subtítulo opcional). */
function PageHeadingSkeleton({ subtitle = false }: { subtitle?: boolean }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-56 sm:h-10 sm:w-72" />
      {subtitle && <Skeleton className="h-4 w-64 max-w-full" />}
    </div>
  );
}

/** Contenido genérico de una sección del panel (título + filas). */
export function AdminContentSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <Status label="Cargando sección…" />
      <Skeleton className="h-8 w-40" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Panel completo (cabecera + pestañas + contenido) para cuando aún se resuelve la sesión. */
export function AdminShellSkeleton() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true">
      <Status label="Cargando panel…" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-64 sm:h-10" />
      </div>
      <Skeleton className="mb-8 mt-6 h-[52px] w-full rounded-2xl sm:max-w-2xl sm:rounded-full" />
      <AdminContentSkeleton />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="container-page py-10 sm:py-14" aria-busy="true">
      <Status label="Cargando carrito…" />
      <PageHeadingSkeleton />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm sm:p-5">
              <Skeleton className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
              <div className="flex flex-1 flex-col justify-between gap-3">
                <Skeleton className="h-5 w-2/3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-11 w-32 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
          <div className="flex items-center justify-between border-t pt-5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="container-page py-10 sm:py-14" aria-busy="true">
      <Status label="Cargando tu cuenta…" />
      <PageHeadingSkeleton subtitle />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.25fr]">
        <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="container-page py-10 sm:py-14" aria-busy="true">
      <Status label="Cargando pedido…" />
      <PageHeadingSkeleton subtitle />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
