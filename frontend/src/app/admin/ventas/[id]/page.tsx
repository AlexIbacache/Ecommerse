'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminOrdersApi, ApiError, type AdminOrderDetail } from '@/lib/api';
import { formatPrice } from '@/lib/format';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'muted';

const ORDER_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', variant: 'muted' },
  PAGADO: { label: 'Pagado', variant: 'default' },
  PAGO_FALLIDO: { label: 'Pago fallido', variant: 'accent' },
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
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Venta no encontrada</h2>
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
        <h2 className="text-xl font-semibold">Venta #{order.id}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>

      <section className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold">Cliente</h3>
        <p className="mt-2 text-sm">{order.customer.name}</p>
        <p className="text-sm text-muted-foreground">{order.customer.email}</p>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio unit.</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.productId}>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="px-4 py-3 text-right font-medium">
                Total
              </td>
              <td className="px-4 py-3 text-right text-lg font-semibold">
                {formatPrice(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-lg border bg-card p-5 text-sm">
        <h3 className="text-sm font-semibold">Pago</h3>
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
