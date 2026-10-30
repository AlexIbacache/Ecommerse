'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminOrdersApi, type AdminOrderSummary } from '@/lib/api';
import { formatPrice } from '@/lib/format';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'muted' | 'success' | 'warning' | 'destructive';

const ORDER_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', variant: 'warning' },
  PAGADO: { label: 'Pagado', variant: 'success' },
  PAGO_FALLIDO: { label: 'Pago fallido', variant: 'destructive' },
  CANCELADO: { label: 'Cancelado', variant: 'outline' },
};

const PAYMENT_STATUS: Record<string, string> = {
  CREADA: 'Iniciado',
  COMPLETADA: 'Completado',
  FALLIDA: 'Fallido',
  CANCELADA: 'Cancelado',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [meta, setMeta] = useState<{ totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await adminOrdersApi.list(page, 10);
      setOrders(result.data);
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
      <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">Ventas</h2>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No pudimos cargar las ventas.
          </p>
          <Button className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Todavía no hay ventas registradas.
        </div>
      ) : (
        <div className="animate-fade-up overflow-x-auto rounded-xl border bg-card motion-reduce:animate-none">
          <table className="block w-full text-sm lg:table lg:min-w-[760px]">
            <thead className="hidden bg-secondary text-left lg:table-header-group font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="block divide-y lg:table-row-group">
              {(orders ?? []).map((order) => {
                const status = ORDER_STATUS[order.status] ?? {
                  label: order.status,
                  variant: 'outline' as BadgeVariant,
                };

                return (
                  <tr key={order.id} className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 lg:table-row lg:p-0">
                    <td data-label="Pedido" className="lg:table-cell lg:px-4 lg:py-3 font-medium before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] lg:before:hidden">#{order.id}</td>
                    <td data-label="Cliente" className="lg:table-cell lg:px-4 lg:py-3 before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] lg:before:hidden">
                      <p>{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td data-label="Fecha" className="lg:table-cell lg:px-4 lg:py-3 text-muted-foreground before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] lg:before:hidden">
                      {formatDate(order.createdAt)}
                    </td>
                    <td data-label="Total" className="lg:table-cell lg:px-4 lg:py-3 font-display font-medium tabular-nums before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] lg:before:hidden">
                      {formatPrice(order.total)}
                    </td>
                    <td data-label="Estado" className="lg:table-cell lg:px-4 lg:py-3 before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] lg:before:hidden">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td data-label="Pago" className="lg:table-cell lg:px-4 lg:py-3 text-muted-foreground before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] lg:before:hidden">
                      {order.paymentStatus
                        ? (PAYMENT_STATUS[order.paymentStatus] ?? order.paymentStatus)
                        : 'Sin pago'}
                    </td>
                    <td className="col-span-2 text-right lg:table-cell lg:px-4 lg:py-3 lg:text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/ventas/${order.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
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
