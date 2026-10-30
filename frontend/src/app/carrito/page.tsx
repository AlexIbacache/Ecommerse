'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CartSkeleton } from '@/components/loading/skeletons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cartApi, type CartValidation, type CartValidationItem } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useCartStore, type CartItem } from '@/stores/cart-store';

const ISSUE_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'Este producto ya no existe.',
  INACTIVE: 'Este producto ya no está disponible.',
  INSUFFICIENT_STOCK: 'No hay stock suficiente para la cantidad elegida.',
};

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [validation, setValidation] = useState<CartValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null);

  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = useCartStore((state) => state.total());

  const itemsKey = items.map((item) => `${item.productId}:${item.quantity}`).join(',');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (items.length === 0) {
      setValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidating(true);

      try {
        const current = useCartStore.getState().items;
        const result = await cartApi.validate(
          current.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            expectedPrice: item.price,
          })),
        );

        setValidation(result);

        const changed = result.items.filter((item) => item.priceChanged && item.price);
        if (changed.length > 0) {
          useCartStore.getState().syncItems(
            changed.map((item) => ({
              productId: item.productId,
              price: item.price,
              stock: item.stock,
              name: item.name,
            })),
          );
          toast.info('Actualizamos los precios del carrito.');
        }
      } catch {
        setValidation(null);
        toast.error('No pudimos validar el carrito. Intenta de nuevo.');
      } finally {
        setValidating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, mounted]);

  function issueFor(productId: number): CartValidationItem | undefined {
    return validation?.items.find((item) => item.productId === productId);
  }

  function confirmRemove() {
    if (pendingRemove) {
      removeItem(pendingRemove.productId);
      toast.success('Producto quitado del carrito');
    }
    setPendingRemove(null);
  }

  if (!mounted) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Carrito</p>
        <h1 className="mt-2 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">
          Explorá el catálogo y sumá tus primeros objetos.
        </p>
        <Button asChild className="mt-6">
          <Link href="/productos">Ver catálogo</Link>
        </Button>
      </div>
    );
  }

  const hasIssues = validation !== null && !validation.valid;
  const canContinue = validation?.valid === true && !validating;

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Carrito</p>
      <h1 className="mt-1 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Tu carrito</h1>

      {hasIssues && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Revisa los ítems marcados antes de continuar con la compra.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <ul className="space-y-4">
          {items.map((item) => {
            const result = issueFor(item.productId);

            return (
              <li key={item.productId} className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary sm:h-24 sm:w-24">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/producto/${item.slug}`} className="inline-block py-1 font-display font-medium leading-snug underline-offset-4 hover:underline">
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingRemove(item)}
                        className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Quitar ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border bg-card">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent"
                          aria-label="Restar una unidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent"
                          aria-label="Sumar una unidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="font-display text-base font-medium tabular-nums">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>

                {result?.issue && (
                  <p role="alert" className="mt-3 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {ISSUE_MESSAGES[result.issue]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-xl border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <p className="eyebrow">Pedido</p>
          <h2 className="mt-1 font-display text-xl font-medium tracking-tight">Resumen</h2>
          <div className="mt-5 flex items-center justify-between border-t pt-5 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-medium tabular-nums tracking-tight">{formatPrice(total)}</span>
          </div>

          {validating && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">Validando stock y precios…</p>
          )}

          {hasIssues && (
            <p className="mt-3 text-sm text-destructive">
              Corregí los ítems marcados para poder continuar.
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={!canContinue}
            onClick={() => router.push('/checkout')}
          >
            Continuar compra
          </Button>
        </aside>
      </div>

      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemove(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Quitar producto</DialogTitle>
          <DialogDescription>
            ¿Quieres quitar “{pendingRemove?.name}” del carrito?
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingRemove(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Quitar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
