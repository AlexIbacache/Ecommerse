'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import type { ProductDetail } from '@/lib/types';

export function AddToCartPanel({ product }: { product: ProductDetail }) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  const max = Math.max(product.stock, 1);
  const disabled = !product.available;

  function change(delta: number) {
    setQuantity((current) => Math.min(Math.max(current + delta, 1), max));
  }

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url ?? null,
        stock: product.stock,
      },
      quantity,
    );
    toast.success(`${quantity} × ${product.name} agregado al carrito`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Cantidad</span>
        <div className="inline-flex items-center rounded-md border">
          <button
            type="button"
            onClick={() => change(-1)}
            disabled={disabled || quantity <= 1}
            className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
            aria-label="Restar una unidad"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => change(1)}
            disabled={disabled || quantity >= max}
            className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
            aria-label="Sumar una unidad"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {product.stock} disponibles
        </span>
      </div>

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        onClick={handleAdd}
        disabled={disabled}
      >
        <ShoppingBag className="h-5 w-5" />
        {disabled ? 'Agotado' : 'Agregar al carrito'}
      </Button>

      {disabled && (
        <p className="text-sm text-muted-foreground">
          Este producto no tiene stock disponible por el momento.
        </p>
      )}
    </div>
  );
}
