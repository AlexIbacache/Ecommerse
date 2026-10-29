'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
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
  const reduce = useReducedMotion();

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
      className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
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

          {(!product.available || product.stock <= 3) && (
            <div className="absolute left-3 top-3">
              {product.available ? (
                <Badge variant="warning" className="bg-card/90 backdrop-blur">Últimas {product.stock} unidades</Badge>
              ) : (
                <Badge variant="outline" className="bg-card/90 backdrop-blur">Agotado</Badge>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-4">
          <p className="eyebrow">{product.category.name}</p>
          <h3 className="line-clamp-2 font-display text-base font-medium leading-snug">
            {product.name}
          </h3>
          <p className="pt-1 font-display text-lg font-medium tabular-nums">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </motion.article>
  );
}
