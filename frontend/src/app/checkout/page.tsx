'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import { PaypalButton } from '@/components/storefront/paypal-button';
import {
  ApiError,
  cartApi,
  ordersApi,
  paymentsApi,
  type CartValidation,
} from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

function CheckoutContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const syncItems = useCartStore((state) => state.syncItems);
  const clear = useCartStore((state) => state.clear);

  const [validation, setValidation] = useState<CartValidation | null>(null);
  const [validating, setValidating] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paypal, setPaypal] = useState<{
    orderId: number;
    paypalOrderId: string;
  } | null>(null);

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  useEffect(() => {
    if (items.length === 0) {
      setValidating(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        const result = await cartApi.validate(
          items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            expectedPrice: item.price,
          })),
        );
        if (!active) {
          return;
        }

        setValidation(result);

        const changed = result.items.filter(
          (item) => item.priceChanged && item.price,
        );
        if (changed.length > 0) {
          syncItems(
            changed.map((item) => ({
              productId: item.productId,
              price: item.price,
              stock: item.stock,
            })),
          );
          toast.info('Actualizamos los precios.');
        }
      } catch {
        if (active) {
          toast.error('No pudimos validar el carrito.');
        }
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startPayment() {
    setCreating(true);

    try {
      const current = useCartStore.getState().items;
      const order = await ordersApi.create(
        current.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );
      const paypalOrder = await ordersApi.createPaypal(order.id);
      setPaypal({ orderId: order.id, paypalOrderId: paypalOrder.paypalOrderId });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Algunos productos ya no están disponibles. Vuelve al carrito.');
      } else {
        toast.error(
          error instanceof ApiError ? error.message : 'No pudimos iniciar el pago.',
        );
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove() {
    if (!paypal) {
      return;
    }

    try {
      await paymentsApi.capture(paypal.paypalOrderId);
      clear();
    } catch {
      toast.error('El pago no se pudo confirmar. Revisa el estado de tu pedido.');
    } finally {
      router.push(`/checkout/resultado?orderId=${paypal.orderId}`);
    }
  }

  async function handleCancel() {
    if (!paypal) {
      return;
    }

    try {
      await ordersApi.cancel(paypal.orderId);
    } catch {
      // el pedido queda pendiente; la página de resultado muestra su estado real
    }

    router.push(`/checkout/resultado?orderId=${paypal.orderId}`);
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">Agrega productos antes de continuar.</p>
        <Button asChild className="mt-6">
          <Link href="/productos">Ver catálogo</Link>
        </Button>
      </div>
    );
  }

  const hasIssues = validation !== null && !validation.valid;

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-1 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Revisa tu compra</h1>

      <div className="mt-8 space-y-5">
        <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-medium tracking-tight">Resumen</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="font-display font-medium tabular-nums">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="font-medium">Total</span>
            <span className="font-display text-2xl font-medium tabular-nums tracking-tight">{formatPrice(total)}</span>
          </div>
        </div>

        {hasIssues && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Hay productos no disponibles o sin stock.{' '}
            <Link href="/carrito" className="underline">
              Vuelve al carrito
            </Link>{' '}
            para corregirlo.
          </div>
        )}

        {paypal ? (
          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-xl font-medium tracking-tight">Completa el pago</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Se abrirá PayPal Sandbox para confirmar el pago de{' '}
              {formatPrice(total)}.
            </p>
            <PaypalButton
              clientId={PAYPAL_CLIENT_ID}
              paypalOrderId={paypal.paypalOrderId}
              onApprove={handleApprove}
              onCancel={handleCancel}
              onError={() => toast.error('Ocurrió un error con PayPal.')}
            />
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={startPayment}
            disabled={creating || validating || hasIssues}
          >
            {creating ? 'Preparando pago…' : 'Pagar con PayPal'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}
