'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';

const STORAGE_KEY = 'store-recent';
const MAX_ITEMS = 6;

export interface ViewedProduct {
  id: number;
  slug: string;
  name: string;
  price: string;
  image: string | null;
}

function readViewed(): ViewedProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ViewedProduct[]) : [];
  } catch {
    return [];
  }
}

function writeViewed(items: ViewedProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // almacenamiento no disponible: el historial es solo una comodidad
  }
}

/** Registra el producto abierto en el historial local. No renderiza nada. */
export function TrackView({ product }: { product: ViewedProduct }) {
  const { id, slug, name, price, image } = product;

  useEffect(() => {
    const rest = readViewed().filter((item) => item.id !== id);
    writeViewed([{ id, slug, name, price, image }, ...rest].slice(0, MAX_ITEMS));
  }, [id, slug, name, price, image]);

  return null;
}

export function RecentlyViewed() {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    setItems(readViewed().slice(0, 3));
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="vistos-titulo" className="pb-16">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="vistos-titulo" className="text-xl font-medium tracking-[-0.02em]">
          Vistos recientemente
        </h2>
        <button
          type="button"
          onClick={() => {
            writeViewed([]);
            setItems([]);
          }}
          className="inline-flex h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Borrar historial
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/producto/${item.slug}`}
            className="flex items-center gap-4 rounded-lg border bg-card p-2.5 shadow-sm transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
          >
            <span className="h-16 w-16 flex-none overflow-hidden rounded-md bg-secondary">
              {item.image && <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-1 block text-sm font-medium">{item.name}</span>
              <span className="mt-0.5 block font-display text-sm tabular-nums text-muted-foreground">
                {formatPrice(item.price)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
