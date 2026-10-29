'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminOrdersApi, ApiError, type AdminOrderDetail } from '@/lib/api';
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
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AdminSaleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setOrder(await adminOrdersApi.get(id));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="font-display text-xl font-medium">Venta no encontrada</h2>
        <Button asChild className="mt-4">
          <Link href="/admin/ventas">Volver a ventas</Link>
        </Button>
      </div>
    );
  }

  const status = ORDER_STATUS[order.status] ?? {
    label: order.status,
    variant: 'outline' as BadgeVariant,
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/ventas" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a ventas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">Venta #{order.id}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="eyebrow">Cliente</h3>
        <p className="mt-2 text-sm">{order.customer.name}</p>
        <p className="text-sm text-muted-foreground">{order.customer.email}</p>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <table className="block w-full text-sm md:table md:min-w-[520px]">
          <thead className="hidden bg-secondary text-left md:table-header-group font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio unit.</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="block divide-y md:table-row-group">
            {order.items.map((item) => (
              <tr key={item.productId} className="grid grid-cols-3 gap-x-4 gap-y-3 p-4 md:table-row md:p-0">
                <td className="col-span-3 font-medium md:table-cell md:px-4 md:py-3">{item.name}</td>
                <td data-label="Cantidad" className="md:table-cell md:px-4 md:py-3 font-mono before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden">{item.quantity}</td>
                <td data-label="Precio unit." className="md:table-cell md:px-4 md:py-3 before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden">{formatPrice(item.unitPrice)}</td>
                <td data-label="Subtotal" className="text-right md:table-cell md:px-4 md:py-3 md:text-right font-display font-medium tabular-nums before:mb-0.5 before:block before:font-mono before:text-[11px] before:uppercase before:tracking-[0.08em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden">
                  {formatPrice(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="block md:table-footer-group">
            <tr className="flex items-center justify-between border-t p-4 md:table-row md:p-0">
              <td colSpan={3} className="font-medium md:px-4 md:py-3 md:text-right">
                Total
              </td>
              <td className="text-right md:px-4 md:py-3 font-display text-2xl font-medium tabular-nums tracking-tight">
                {formatPrice(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-xl border bg-card p-5 text-sm">
        <h3 className="eyebrow">Pago</h3>
        {order.payment ? (
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>
              Estado: <span className="text-foreground">{PAYMENT_STATUS[order.payment.status] ?? order.payment.status}</span>
            </p>
            <p>
              Importe: <span className="text-foreground">{formatPrice(order.payment.amount)}</span>
            </p>
            {order.payment.paypalOrderId && (
              <p className="font-mono text-xs">
                PayPal order: {order.payment.paypalOrderId}
              </p>
            )}
            {order.payment.paypalCaptureId && (
              <p className="font-mono text-xs">
                PayPal capture: {order.payment.paypalCaptureId}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">Sin pago registrado.</p>
        )}
      </section>
    </div>
  );
}
