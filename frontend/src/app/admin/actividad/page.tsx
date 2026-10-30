'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminInsightsApi, type AuditAction, type AuditEntry } from '@/lib/admin-insights';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'muted' | 'success' | 'warning' | 'destructive';

const ACTIONS: Record<AuditAction, { label: string; variant: BadgeVariant }> = {
  PRODUCT_CREATED: { label: 'Producto creado', variant: 'success' },
  PRODUCT_UPDATED: { label: 'Producto editado', variant: 'accent' },
  PRODUCT_DEACTIVATED: { label: 'Producto desactivado', variant: 'warning' },
  PRODUCT_DELETED: { label: 'Producto eliminado', variant: 'destructive' },
  COMMENT_HIDDEN: { label: 'Comentario oculto', variant: 'warning' },
  COMMENT_RESTORED: { label: 'Comentario restaurado', variant: 'success' },
  COMMENT_DELETED: { label: 'Comentario eliminado', variant: 'destructive' },
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function targetLabel(entry: AuditEntry): string {
  return entry.entityType === 'COMMENT' ? `En el producto «${entry.summary}»` : entry.summary;
}

export default function AdminActivityPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [meta, setMeta] = useState<{ totalPages: number; totalItems: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await adminInsightsApi.audit(page, 15);
      setEntries(result.data);
      setMeta(result.meta);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">Actividad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cambios hechos por administradores sobre productos y comentarios.
          </p>
        </div>
        {meta && meta.totalItems > 0 && (
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {meta.totalItems} {meta.totalItems === 1 ? 'registro' : 'registros'}
          </p>
        )}
      </div>

      {loading && !entries ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No pudimos cargar la actividad.</p>
          <Button className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      ) : entries && entries.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Todavía no hay actividad registrada. Aparecerá aquí cuando se cree, edite o elimine un producto, o se
          modere un comentario.
        </div>
      ) : (
        <ul className={`divide-y rounded-xl border bg-card transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
          {entries?.map((entry) => {
            const action = ACTIONS[entry.action] ?? { label: entry.action, variant: 'outline' as BadgeVariant };

            return (
              <li
                key={entry.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5"
              >
                <div className="min-w-0 space-y-1">
                  <Badge variant={action.variant}>{action.label}</Badge>
                  <p className="break-words text-sm font-medium">{targetLabel(entry)}</p>
                  {entry.details && <p className="text-sm text-muted-foreground">{entry.details}</p>}
                </div>
                <div className="flex-none text-sm sm:text-right">
                  <p>{entry.actor?.name ?? 'Administrador eliminado'}</p>
                  <p className="font-mono text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
