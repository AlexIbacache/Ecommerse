'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { buildHref, type CatalogParams } from '@/components/storefront/catalog-query';
import { formatPrice } from '@/lib/format';

export interface CategoryOption {
  slug: string;
  name: string;
  count: number;
}

interface FilterProps {
  categories: CategoryOption[];
  params: CatalogParams;
  /** Precio más alto del catálogo, redondeado hacia arriba. */
  bound: number;
  total: number;
}

const eyebrowClass = 'font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground';
const optionClass =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm transition-colors hover:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';
const checkClass = 'h-[18px] w-[18px] flex-none accent-accent';

function FilterFields({ categories, params, bound, total }: FilterProps) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [price, setPrice] = useState(params.max ?? bound);

  useEffect(() => setPrice(params.max ?? bound), [params.max, bound]);
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  function go(patch: Partial<CatalogParams>) {
    router.push(buildHref(params, patch), { scroll: false });
  }

  function toggleCategory(slug: string) {
    const categoriesNext = params.categories.includes(slug)
      ? params.categories.filter((item) => item !== slug)
      : [...params.categories, slug];
    go({ categories: categoriesNext });
  }

  function changePrice(value: number) {
    setPrice(value);
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(() => go({ max: value >= bound ? undefined : value }), 300);
  }

  const presets = [50, 150, 400].filter((value) => value < bound);

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className={eyebrowClass}>Categoría</legend>
        <div className="mt-2 space-y-0.5">
          {categories.map((category) => (
            <label key={category.slug} className={optionClass}>
              <input
                type="checkbox"
                checked={params.categories.includes(category.slug)}
                onChange={() => toggleCategory(category.slug)}
                className={checkClass}
              />
              <span className="flex-1">{category.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{category.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="border-t pt-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="filtro-precio" className={eyebrowClass}>Precio máximo</label>
          <output htmlFor="filtro-precio" className="font-display text-base font-medium tabular-nums">
            {price >= bound ? 'Sin límite' : formatPrice(String(price))}
          </output>
        </div>
        <input
          id="filtro-precio"
          type="range"
          min={0}
          max={bound}
          step={10}
          value={price}
          onChange={(event) => changePrice(Number(event.target.value))}
          className="mt-3 h-11 w-full accent-accent"
        />
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>$0</span>
          <span>${bound}</span>
        </div>
        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presets.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => go({ max: value })}
                className={`h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  params.max === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-card hover:border-accent'
                }`}
              >
                Hasta ${value}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-3">
        <fieldset>
          <legend className={eyebrowClass}>Disponibilidad</legend>
          <div className="mt-2 space-y-0.5">
          <label className={optionClass}>
            <input type="checkbox" checked={params.stock} onChange={() => go({ stock: !params.stock })} className={checkClass} />
            Solo con stock
          </label>
          <label className={optionClass}>
            <input type="checkbox" checked={params.low} onChange={() => go({ low: !params.low })} className={checkClass} />
            Últimas unidades
          </label>
          </div>
        </fieldset>
      </div>

      <span className="sr-only !mt-0" aria-live="polite">{total} productos</span>
    </div>
  );
}

/** Panel lateral de escritorio. */
export function CatalogFilters(props: FilterProps & { clearHref: string }) {
  const router = useRouter();
  const { clearHref, ...rest } = props;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium tracking-tight">Filtros</h2>
        <button
          type="button"
          onClick={() => router.push(clearHref, { scroll: false })}
          className="inline-flex h-11 items-center px-1 text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Limpiar
        </button>
      </div>
      <FilterFields {...rest} />
    </div>
  );
}

/** Botón + panel inferior para pantallas pequeñas. */
export function MobileFilters(props: FilterProps & { clearHref: string; activeCount: number }) {
  const router = useRouter();
  const { clearHref, activeCount, ...rest } = props;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[11px] font-medium text-accent-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="p-0">
        <SheetHeader className="px-5 pb-2 pt-5">
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <FilterFields {...rest} />
        </div>
        <div className="flex gap-3 border-t bg-background p-4">
          <Button variant="outline" size="lg" onClick={() => router.push(clearHref, { scroll: false })}>
            Limpiar
          </Button>
          <SheetClose asChild>
            <Button size="lg" className="flex-1">
              Ver {rest.total} productos
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
