'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronDown, ChevronRight, Sparkles, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { Category, ProductListItem } from '@/lib/types';

const linkBase =
  'inline-flex h-10 items-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function ProductsMenu({
  categories,
  latest,
  active,
  pathname,
}: {
  categories: Category[];
  latest: ProductListItem | null;
  active: boolean;
  pathname: string;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => () => clearTimeout(closeTimer.current ?? undefined), []);

  function openNow() {
    clearTimeout(closeTimer.current ?? undefined);
    setOpen(true);
  }
  function closeSoon() {
    clearTimeout(closeTimer.current ?? undefined);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div
        className={`flex items-center rounded-full transition-colors ${
          active || open ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
      >
        <Link
          href="/productos"
          aria-current={active ? 'page' : undefined}
          className={`${linkBase} pl-4 pr-1`}
        >
          Productos
        </Link>
        <button
          ref={toggle}
          type="button"
          aria-label="Categorías"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute -left-4 top-full z-50 w-[min(560px,calc(100vw-2rem))] pt-2"
          >
            <div className="flex gap-3 rounded-xl border bg-card p-3 text-foreground shadow-lg shadow-glow">
              <div className="flex-1 p-2">
                <p className="eyebrow px-2 pb-2">Categorías</p>
                <ul className="space-y-0.5">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/productos?category=${category.slug}`}
                        className="group flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium transition-[background-color,transform] duration-200 hover:translate-x-1 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                      >
                        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-md border bg-secondary text-accent">
                          <Tag className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{category.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                  {categories.length === 0 && (
                    <li className="px-2 py-3 text-sm text-muted-foreground">No hay categorías disponibles.</li>
                  )}
                </ul>
                <Link
                  href="/productos"
                  className="mt-2 flex min-h-11 items-center gap-1.5 border-t px-2 pt-2 text-sm font-medium text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Ver todo el catálogo <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <Link
                href={latest ? `/producto/${latest.slug}` : '/productos'}
                className="surface-navy group/promo relative hidden min-h-56 w-56 flex-col justify-end gap-1 overflow-hidden rounded-lg border p-4 text-white sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {latest?.image && (
                  <>
                    <img
                      src={latest.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/promo:scale-105 motion-reduce:transition-none"
                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/55 to-transparent" />
                  </>
                )}
                <span className="relative flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-cyan-glow">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Recién llegado
                </span>
                <span className="relative font-display text-lg font-medium leading-tight tracking-tight">
                  {latest ? latest.name : 'Recién llegados'}
                </span>
                <span className="relative text-sm text-slate-200">
                  {latest ? formatPrice(latest.price) : 'Lo último que sumamos al catálogo.'}
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
