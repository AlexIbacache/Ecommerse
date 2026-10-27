'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import { ApiError, ordersApi, type OrderDetail } from '@/lib/api';
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
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

function OrderContent() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [order, setOrder] = useState<OrderDetail | null>(null);
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
        setOrder(await ordersApi.get(id));
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
      <div className="container-page py-16">
        <p className="text-sm text-muted-foreground">Cargando pedido…</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold">Pedido no encontrado</h1>
        <Button asChild className="mt-6">
          <Link href="/cuenta">Volver a mi cuenta</Link>
        </Button>
      </div>
    );
  }

  const status = ORDER_STATUS[order.status] ?? {
    label: order.status,
    variant: 'outline' as BadgeVariant,
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/cuenta" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a mi cuenta
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Pedido #{order.id}</h1>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(order.createdAt)}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border bg-card">
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/producto/${item.slug}`} className="font-medium hover:underline">
                  {item.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {formatPrice(Number(item.unitPrice) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t p-4">
          <span className="font-medium">Total</span>
          <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Estado del pedido: </span>
          {ORDER_STATUS[order.status]?.label ?? order.status}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">Estado del pago: </span>
          {PAYMENT_STATUS[order.payment?.status ?? ''] ?? 'Sin pago'}
        </p>
        {order.payment?.paypalOrderId && (
          <p className="mt-1 text-xs text-muted-foreground">
            Transacción PayPal: {order.payment.paypalOrderId}
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderContent />
    </RequireAuth>
  );
}
