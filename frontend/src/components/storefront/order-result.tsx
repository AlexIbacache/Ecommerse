'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersApi, type OrderDetail } from '@/lib/api';
import { formatPrice } from '@/lib/format';

const STATES = {
  PAGADO: {
    icon: CheckCircle2,
    title: '¡Gracias por tu compra!',
    text: 'Tu pago fue confirmado.',
    tone: 'bg-success/10 text-success',
  },
  PAGO_FALLIDO: {
    icon: XCircle,
    title: 'El pago no se completó',
    text: 'No se registró ningún cargo. Puedes volver a intentarlo.',
    tone: 'bg-destructive/10 text-destructive',
  },
  CANCELADO: {
    icon: AlertTriangle,
    title: 'Compra cancelada',
    text: 'Cancelaste el pago en PayPal.',
    tone: 'bg-muted text-muted-foreground',
  },
  PENDIENTE_PAGO: {
    icon: Clock,
    title: 'Pago pendiente',
    text: 'Todavía no se confirmó el pago.',
    tone: 'bg-warning/10 text-warning',
  },
} as const;

export function OrderResult({ orderId }: { orderId: number | null }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (orderId == null) {
      setError(true);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setOrder(await ordersApi.get(orderId));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container-page py-24 text-center" role="status">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">Consultando el estado del pedido…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Error</p>
        <h1 className="mt-2 text-3xl font-normal tracking-[-0.03em]">Pedido no encontrado</h1>
        <Button asChild className="mt-6">
          <Link href="/">Volver a la tienda</Link>
        </Button>
      </div>
    );
  }

  const state = STATES[order.status as keyof typeof STATES] ?? STATES.PENDIENTE_PAGO;
  const Icon = state.icon;
  const canRetry = order.status === 'PENDIENTE_PAGO' || order.status === 'PAGO_FALLIDO';

  return (
    <div className="container-page max-w-xl py-16 text-center sm:py-24">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${state.tone}`}>
        <Icon className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">{state.title}</h1>
      <p className="mt-2 text-muted-foreground">{state.text}</p>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
        Total: <span className="font-display text-base font-medium normal-case tracking-normal text-foreground tabular-nums">{formatPrice(order.total)}</span>
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Volver a la tienda</Link>
        </Button>
        {canRetry && (
          <Button asChild variant="outline">
            <Link href="/carrito">Reintentar compra</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
