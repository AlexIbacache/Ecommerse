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
        toast.error('Algunos productos ya no están disponibles. Volvé al carrito.');
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
      toast.error('El pago no se pudo confirmar. Revisá el estado de tu pedido.');
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
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">Agregá productos antes de continuar.</p>
        <Button asChild className="mt-6">
          <Link href="/productos">Ver catálogo</Link>
        </Button>
      </div>
    );
  }

  const hasIssues = validation !== null && !validation.valid;

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-3xl font-semibold">Revisá tu compra</h1>

      <div className="mt-8 space-y-5">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="font-medium">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="font-medium">Total</span>
            <span className="text-xl font-semibold">{formatPrice(total)}</span>
          </div>
        </div>

        {hasIssues && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            Hay productos no disponibles o sin stock.{' '}
            <Link href="/carrito" className="underline">
              Volvé al carrito
            </Link>{' '}
            para corregirlo.
          </div>
        )}

        {paypal ? (
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">Completá el pago</h2>
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
