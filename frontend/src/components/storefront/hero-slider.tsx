'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import type { ProductListItem } from '@/lib/types';
import { useCartStore } from '@/stores/cart-store';

const INTERVAL_MS = 6000;
const EASE = [0.2, 0.7, 0.2, 1] as const;

export function HeroSlider({ products }: { products: ProductListItem[] }) {
  const reduce = useReducedMotion();
  const addItem = useCartStore((state) => state.addItem);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const total = products.length;
  const autoplay = !reduce && !userPaused && !hovered && total > 1;

  const go = useCallback(
    (next: number, dir?: number) => {
      setDirection(dir ?? (next >= index ? 1 : -1));
      setIndex((next + total) % total);
    },
    [index, total],
  );

  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(() => go(index + 1, 1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [autoplay, go, index]);

  if (total === 0) {
    return (
      <section className="surface-navy mt-4 rounded-2xl border border-border/60 p-6 sm:p-10 lg:p-14">
        <p className="eyebrow">Tienda online</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
          Productos elegidos para tu día a día.
        </h1>
        <Button asChild size="lg" className="mt-8">
          <Link href="/productos">Ver catálogo</Link>
        </Button>
      </section>
    );
  }

  const product = products[index];
  const low = product.available && product.stock <= 3;
  const shift = reduce ? 0 : 28;

  function handleAdd() {
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

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      className="surface-navy relative mt-4 overflow-hidden rounded-2xl border border-border/60"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(index - 1, -1);
        if (event.key === 'ArrowRight') go(index + 1, 1);
      }}
    >
      <motion.div
        className="touch-pan-y"
        onPanEnd={(_, info) => {
          if (info.offset.x < -60) go(index + 1, 1);
          if (info.offset.x > 60) go(index - 1, -1);
        }}
      >
        <div
          aria-live={autoplay ? 'off' : 'polite'}
          className="grid min-h-[600px] items-center gap-8 p-6 pb-28 sm:p-10 sm:pb-28 lg:min-h-[540px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:p-14 lg:pb-28"
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={`text-${product.id}`}
              initial={{ opacity: 0, x: direction * shift }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -shift }}
              transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
              className="space-y-5"
            >
              <p className="eyebrow">
                {low ? `Últimas ${product.stock} unidades` : 'Destacado'} · {product.category.name}
              </p>
              <h1 className="text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>
              <p className="max-w-md text-base text-muted-foreground sm:text-lg">
                {low
                  ? 'Quedan pocas piezas. Cuando se agoten, no hay reposición asegurada.'
                  : 'Envío a todo el país y pago seguro con PayPal Sandbox.'}
              </p>
              <p className="font-display text-3xl font-medium tabular-nums tracking-[-0.02em] sm:text-4xl">
                {formatPrice(product.price)}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild size="lg" variant="accent">
                  <Link href={`/producto/${product.slug}`}>
                    Ver producto <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                {product.available && (
                  <Button size="lg" variant="outline" onClick={handleAdd}>
                    Agregar al carrito
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={`img-${product.id}`}
              initial={{ opacity: 0, x: direction * shift * 1.5, scale: reduce ? 1 : 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -shift * 1.5, scale: reduce ? 1 : 0.96 }}
              transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
              className="relative"
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary shadow-glow"
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="absolute inset-x-6 bottom-5 flex items-center gap-3 sm:inset-x-10 sm:bottom-6 lg:inset-x-14">
        <div role="group" aria-label="Elegir diapositiva" className="flex items-center">
          {products.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir a ${item.name} (${i + 1} de ${total})`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
              className="group flex h-11 items-center px-1 focus-visible:outline-none"
            >
              <span
                className={`block h-2 rounded-full transition-[width,background-color] duration-300 group-focus-visible:ring-2 group-focus-visible:ring-ring motion-reduce:transition-none ${
                  i === index ? 'w-8 bg-accent' : 'w-2 bg-input group-hover:bg-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="hidden whitespace-nowrap font-mono text-xs tracking-[0.08em] text-muted-foreground sm:inline" aria-hidden="true">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>

        {total > 1 && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              aria-label={userPaused || reduce ? 'Reanudar carrusel' : 'Pausar carrusel'}
              aria-pressed={userPaused}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-input bg-background/70 text-foreground transition-colors hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {userPaused || reduce ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => go(index - 1, -1)}
              aria-label="Anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-input bg-background/70 text-foreground transition-colors hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, 1)}
              aria-label="Siguiente"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-input bg-background/70 text-foreground transition-colors hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
