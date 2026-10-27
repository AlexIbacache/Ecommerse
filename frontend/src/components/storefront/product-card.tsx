'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import type { ProductListItem } from '@/lib/types';

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductListItem;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
      className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}

          <div className="absolute left-3 top-3">
            {product.available ? (
              product.stock <= 3 ? (
                <Badge variant="accent">Últimas {product.stock} unidades</Badge>
              ) : (
                <Badge variant="muted">En stock</Badge>
              )
            ) : (
              <Badge variant="outline">Agotado</Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 p-4">
          <p className="eyebrow">{product.category.name}</p>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {product.name}
          </h3>
          <p className="pt-1 text-lg font-semibold">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </motion.article>
  );
}
