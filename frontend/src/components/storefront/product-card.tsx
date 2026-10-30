'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { StarRating } from '@/components/storefront/star-rating';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import type { ProductListItem } from '@/lib/types';
import { useCartStore } from '@/stores/cart-store';

export function ProductCard({
  product,
  index = 0,
  layout = 'grid',
}: {
  product: ProductListItem;
  index?: number;
  layout?: 'grid' | 'list';
}) {
  const reduce = useReducedMotion();
  const addItem = useCartStore((state) => state.addItem);
  const list = layout === 'list';

  function handleQuickAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    });
    toast.success(`${product.name} agregado al carrito`);
  }

  const badge =
    !product.available || product.stock <= 3 ? (
      product.available ? (
        <Badge variant="warning" className="bg-card/90 backdrop-blur">Últimas {product.stock} unidades</Badge>
      ) : (
        <Badge variant="outline" className="bg-card/90 backdrop-blur">Agotado</Badge>
      )
    ) : null;

  const image = (
    <Link href={`/producto/${product.slug}`} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
      {product.image ? (
        <img
          src={product.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Sin imagen
        </div>
      )}
    </Link>
  );

  const addButton = product.available && (
    <button
      type="button"
      onClick={handleQuickAdd}
      aria-label={`Agregar ${product.name} al carrito`}
      className={
        list
          ? 'flex h-11 flex-none items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'absolute bottom-2 right-2 flex h-11 items-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground shadow-lg transition-[opacity,transform,background-color] duration-200 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:bottom-3 sm:right-3 sm:px-4 md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100'
      }
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Agregar</span>
    </button>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -5% 0px' }}
      transition={{
        duration: reduce ? 0 : 0.3,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.3),
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className={`group overflow-hidden rounded-lg border border-input/60 bg-card shadow-sm transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-accent hover:shadow-lg motion-reduce:transform-none ${
        list ? 'flex items-center gap-4 p-3 sm:gap-5' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-secondary ${
          list ? 'h-28 w-28 flex-none rounded-md sm:h-32 sm:w-32' : 'aspect-square'
        }`}
      >
        {image}
        {badge && !list && <div className="pointer-events-none absolute left-3 top-3">{badge}</div>}
        {!list && addButton}
      </div>

      <Link
        href={`/producto/${product.slug}`}
        className={`block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
          list ? 'min-w-0 flex-1 space-y-1.5 rounded-md' : 'space-y-1.5 p-3 sm:p-4'
        }`}
      >
        <p className="eyebrow">{product.category.name}</p>
        <h3 className={`font-display font-medium leading-snug ${list ? 'text-base sm:text-lg' : 'line-clamp-2 text-sm sm:text-base'}`}>
          {product.name}
        </h3>
        {product.rating && product.rating.count > 0 && product.rating.average !== null && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StarRating value={product.rating.average} size="sm" />
            <span className="tabular-nums">
              {product.rating.average.toFixed(1)} ({product.rating.count})
            </span>
          </p>
        )}
        {list && badge && <div>{badge}</div>}
        <p className="pt-1 font-display text-base font-medium tabular-nums sm:text-lg">
          {formatPrice(product.price)}
        </p>
      </Link>

      {list && <div className="flex-none pr-1">{addButton}</div>}
    </motion.article>
  );
}
