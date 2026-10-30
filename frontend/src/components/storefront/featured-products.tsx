'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProductCard } from '@/components/storefront/product-card';
import type { ProductListItem } from '@/lib/types';

type Tab = 'nuevos' | 'ultimas';

export function FeaturedProducts({
  recent,
  low,
}: {
  recent: ProductListItem[];
  low: ProductListItem[];
}) {
  const [tab, setTab] = useState<Tab>('nuevos');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'nuevos', label: 'Recién llegados' },
    { id: 'ultimas', label: 'Últimas unidades' },
  ];
  const products = tab === 'nuevos' ? recent : low;

  return (
    <section id="destacados" className="space-y-8 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Destacados</p>
          <h2 className="mt-1 text-3xl font-normal tracking-[-0.025em] sm:text-4xl">
            {tab === 'nuevos' ? 'Lo que está llegando' : 'Quedan pocas piezas'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {low.length > 0 && (
            <div role="tablist" aria-label="Filtrar destacados" className="flex gap-1 rounded-full border bg-card p-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={`h-10 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    tab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <Link href="/productos" className="inline-flex h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline">
            Ver todo →
          </Link>
        </div>
      </div>

      <div key={tab} role="tabpanel" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
