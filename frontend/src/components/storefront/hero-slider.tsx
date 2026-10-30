'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
  type Variants,
} from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import type { ProductListItem } from '@/lib/types';
import { useCartStore } from '@/stores/cart-store';

const INTERVAL_MS = 6000;
const EASE = [0.2, 0.7, 0.2, 1] as const;
const PARALLAX_PX = 8;

interface SlideCustom {
  dir: number;
  shift: number;
  /** Primer render: la imagen no parte de opacity 0 (es el LCP). */
  first: boolean;
}

/** Zoom lento sobre la imagen; avanza y se pausa junto con el autoplay. Un solo loop por elemento. */
function KenBurnsImage({ src, alt, playing, reduce }: { src: string; alt: string; playing: boolean; reduce: boolean }) {
  const scale = useMotionValue(1);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    if (reduce) return;
    controls.current = animate(scale, 1.04, { duration: INTERVAL_MS / 1000, ease: 'linear' });
    return () => controls.current?.stop();
  }, [reduce, scale]);

  useEffect(() => {
    if (playing) controls.current?.play();
    else controls.current?.pause();
  }, [playing]);

  return (
    <motion.img
      src={src}
      alt={alt}
      draggable={false}
      style={{ scale }}
      className="h-full w-full select-none object-cover"
    />
  );
}

function HeroCarousel({ products }: { products: ProductListItem[] }) {
  const reduce = useReducedMotion() ?? false;
  const addItem = useCartStore((state) => state.addItem);
  const sectionRef = useRef<HTMLElement>(null);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [navigated, setNavigated] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const total = products.length;
  const playing = !userPaused && !hovered && !touching && !tabHidden;
  const autoplay = !reduce && playing && total > 1;

  // Progreso del autoplay (0→1): alimenta el dot activo y se pausa con el resto.
  const progress = useMotionValue(0);

  const go = useCallback(
    (next: number, dir?: number) => {
      const target = (next + total) % total;
      if (target === index) return;
      setDirection(dir ?? (next >= index ? 1 : -1));
      setNavigated(true);
      setIndex(target);
      progress.set(0);
    },
    [index, total, progress],
  );

  useEffect(() => {
    if (!autoplay) return;
    const controls = animate(progress, 1, {
      duration: (INTERVAL_MS / 1000) * (1 - progress.get()),
      ease: 'linear',
      onComplete: () => go(index + 1, 1),
    });
    return () => controls.stop();
  }, [autoplay, go, index, progress]);

  useEffect(() => {
    const onChange = () => setTabHidden(document.hidden);
    onChange();
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  // Parallax con el mouse (solo punteros tipo mouse, no touch).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mx, [-1, 1], [-PARALLAX_PX, PARALLAX_PX]), { stiffness: 120, damping: 20 });
  const parallaxY = useSpring(useTransform(my, [-1, 1], [-PARALLAX_PX, PARALLAX_PX]), { stiffness: 120, damping: 20 });

  function handlePointerMove(event: React.PointerEvent) {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  // Salida por scroll: la imagen baja un poco y el texto se atenúa.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const scrollImageY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const scrollTextOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  const product = products[index];
  const low = product.available && product.stock <= 3;
  const shift = reduce ? 0 : 28;
  const custom: SlideCustom = { dir: direction, shift, first: !navigated };

  const textVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.04 } },
    exit: ({ dir, shift: s }: SlideCustom) => ({
      opacity: 0,
      x: -dir * s,
      transition: { duration: reduce ? 0 : 0.18, ease: EASE },
    }),
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4, ease: EASE } },
  };

  const imageVariants: Variants = {
    hidden: ({ dir, shift: s, first }: SlideCustom) =>
      first
        ? { opacity: 1, scale: reduce ? 1 : 1.04 }
        : { opacity: 0, x: dir * s * 1.5, scale: reduce ? 1 : 0.96 },
    show: { opacity: 1, x: 0, scale: 1, transition: { duration: reduce ? 0 : 0.4, ease: EASE } },
    exit: ({ dir, shift: s }: SlideCustom) => ({
      opacity: 0,
      x: -dir * s * 1.5,
      scale: reduce ? 1 : 0.96,
      transition: { duration: reduce ? 0 : 0.2, ease: EASE },
    }),
  };

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

  const navButton =
    'group flex h-11 w-11 items-center justify-center rounded-full border border-input bg-background/70 text-foreground transition-colors hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      className="surface-navy relative mt-4 overflow-hidden rounded-2xl border border-border/60"
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        setHovered(false);
        mx.set(0);
        my.set(0);
      }}
      onPointerMove={handlePointerMove}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={() => setTouching(false)}
      onTouchCancel={() => setTouching(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') go(index - 1, -1);
        if (event.key === 'ArrowRight') go(index + 1, 1);
      }}
    >
      <motion.div
        className="touch-pan-y"
        drag={total > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={reduce ? 0 : 0.15}
        dragDirectionLock
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 || info.velocity.x < -500) go(index + 1, 1);
          else if (info.offset.x > 60 || info.velocity.x > 500) go(index - 1, -1);
        }}
      >
        <div
          aria-live={autoplay ? 'off' : 'polite'}
          className="grid min-h-[600px] items-center gap-8 p-6 pb-28 sm:p-10 sm:pb-28 lg:min-h-[540px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:p-14 lg:pb-28"
        >
          <motion.div style={reduce ? undefined : { opacity: scrollTextOpacity }}>
            <AnimatePresence mode="wait" custom={custom}>
              <motion.div
                key={`text-${product.id}`}
                custom={custom}
                variants={textVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-5"
              >
                <motion.p variants={itemVariants} className="eyebrow">
                  {low ? `Últimas ${product.stock} unidades` : 'Destacado'} · {product.category.name}
                </motion.p>
                <motion.h1
                  variants={itemVariants}
                  className="text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl"
                >
                  {product.name}
                </motion.h1>
                <motion.p variants={itemVariants} className="max-w-md text-base text-muted-foreground sm:text-lg">
                  {low
                    ? 'Quedan pocas piezas. Cuando se agoten, no hay reposición asegurada.'
                    : 'Envío a todo el país y pago seguro con PayPal Sandbox.'}
                </motion.p>
                <motion.p
                  variants={itemVariants}
                  className="font-display text-3xl font-medium tabular-nums tracking-[-0.02em] sm:text-4xl"
                >
                  {formatPrice(product.price)}
                </motion.p>
                <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-1">
                  <Button asChild size="lg" variant="accent" className="group hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none">
                    <Link href={`/producto/${product.slug}`}>
                      Ver producto{' '}
                      <ArrowRight
                        className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                  {product.available && (
                    <motion.div whileTap={reduce ? undefined : { scale: 0.98 }} transition={{ duration: 0.15, ease: EASE }}>
                      <Button size="lg" variant="outline" onClick={handleAdd}>
                        Agregar al carrito
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div className="relative" style={reduce ? undefined : { y: scrollImageY }}>
            {!reduce && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10"
                style={{ background: 'radial-gradient(closest-side, hsl(189 94% 43% / 0.13), transparent 70%)' }}
                animate={{ x: [0, 24, 0], y: [0, -14, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <AnimatePresence mode="wait" custom={custom}>
              <motion.div
                key={`img-${product.id}`}
                custom={custom}
                variants={imageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative"
              >
                <motion.div style={reduce ? undefined : { x: parallaxX, y: parallaxY }}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary shadow-glow">
                    {product.image ? (
                      <KenBurnsImage src={product.image} alt={product.name} playing={playing} reduce={reduce} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
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
              className="group flex h-11 w-8 items-center justify-center focus-visible:outline-none"
            >
              <span className="relative block h-2 w-8 rounded-full group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <span className="absolute left-3 top-0 h-2 w-2 rounded-full bg-input transition-colors group-hover:bg-muted-foreground motion-reduce:transition-none" />
                {i === index && (
                  <motion.span
                    className="absolute inset-0 overflow-hidden rounded-full bg-input"
                    initial={reduce ? false : { scaleX: 0.25, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 34 }}
                  >
                    <motion.span
                      className="absolute inset-0 origin-left rounded-full bg-accent"
                      style={{ scaleX: reduce || total < 2 ? 1 : progress }}
                    />
                  </motion.span>
                )}
              </span>
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
              className={navButton}
            >
              {userPaused || reduce ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => go(index - 1, -1)} aria-label="Anterior" className={navButton}>
              <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transform-none" />
            </button>
            <button type="button" onClick={() => go(index + 1, 1)} aria-label="Siguiente" className={navButton}>
              <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroSlider({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
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

  return <HeroCarousel products={products} />;
}
