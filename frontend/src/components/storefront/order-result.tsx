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
    tone: 'text-primary',
  },
  PAGO_FALLIDO: {
    icon: XCircle,
    title: 'El pago no se completó',
    text: 'No se registró ningún cargo. Podés volver a intentarlo.',
    tone: 'text-destructive',
  },
  CANCELADO: {
    icon: AlertTriangle,
    title: 'Compra cancelada',
    text: 'Cancelaste el pago en PayPal.',
    tone: 'text-muted-foreground',
  },
  PENDIENTE_PAGO: {
    icon: Clock,
    title: 'Pago pendiente',
    text: 'Todavía no se confirmó el pago.',
    tone: 'text-muted-foreground',
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
      <div className="container-page py-20 text-center">
        <p className="text-muted-foreground">Consultando el estado del pedido…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-semibold">Pedido no encontrado</h1>
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
    <div className="container-page max-w-xl py-16 text-center">
      <Icon className={`mx-auto h-12 w-12 ${state.tone}`} />
      <h1 className="mt-4 text-2xl font-semibold">{state.title}</h1>
      <p className="mt-2 text-muted-foreground">{state.text}</p>
      <p className="mt-4 text-sm">
        Total: <span className="font-semibold">{formatPrice(order.total)}</span>
      </p>

      <div className="mt-8 flex justify-center gap-3">
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
