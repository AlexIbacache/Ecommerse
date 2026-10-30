import Link from 'next/link';
import { X } from 'lucide-react';
import { CatalogControls } from '@/components/storefront/catalog-controls';
import { CatalogFilters, MobileFilters } from '@/components/storefront/catalog-filters';
import {
  PAGE_SIZE,
  buildHref,
  countActiveFilters,
  parseParams,
} from '@/components/storefront/catalog-query';
import { ProductCard } from '@/components/storefront/product-card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { getCategories, getProducts } from '@/lib/catalog';
import type { ProductListItem } from '@/lib/types';

const API_PAGE_SIZE = 48;
const MAX_API_PAGES = 10;

/** La API filtra por texto y orden; el resto de filtros se aplican acá con el catálogo completo. */
async function getAllProducts(q: string | undefined, sort: string): Promise<ProductListItem[]> {
  const first = await getProducts({ q, sort, page: 1, pageSize: API_PAGE_SIZE });
  const pages = Math.min(first.meta.totalPages, MAX_API_PAGES);
  if (pages <= 1) return first.data;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      getProducts({ q, sort, page: index + 2, pageSize: API_PAGE_SIZE }),
    ),
  );
  return [first, ...rest].flatMap((result) => result.data);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseParams(await searchParams);

  const [categories, all] = await Promise.all([getCategories(), getAllProducts(params.q, params.sort)]);

  const bound = Math.max(10, Math.ceil(Math.max(0, ...all.map((product) => Number(product.price))) / 10) * 10);

  const filtered = all.filter(
    (product) =>
      (params.categories.length === 0 || params.categories.includes(product.category.slug)) &&
      (params.max === undefined || Number(product.price) <= params.max) &&
      (!params.stock || product.available) &&
      (!params.low || (product.available && product.stock <= 3)),
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const from = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(from, from + PAGE_SIZE);

  const categoryOptions = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: all.filter((product) => product.category.slug === category.slug).length,
  }));

  const activeCount = countActiveFilters(params, bound);
  const clearHref = buildHref(params, { categories: [], max: undefined, stock: false, low: false, q: undefined });

  const activeChips: { label: string; href: string }[] = [
    ...params.categories.map((slug) => ({
      label: categories.find((category) => category.slug === slug)?.name ?? slug,
      href: buildHref(params, { categories: params.categories.filter((item) => item !== slug) }),
    })),
    ...(params.max !== undefined && params.max < bound
      ? [{ label: `Hasta $${params.max}`, href: buildHref(params, { max: undefined }) }]
      : []),
    ...(params.stock ? [{ label: 'Solo con stock', href: buildHref(params, { stock: false }) }] : []),
    ...(params.low ? [{ label: 'Últimas unidades', href: buildHref(params, { low: false }) }] : []),
    ...(params.q ? [{ label: `“${params.q}”`, href: buildHref(params, { q: undefined }) }] : []),
  ];

  const chipClass = (active: boolean) =>
    `inline-flex h-11 flex-none items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-input bg-card hover:border-accent'
    }`;

  const filterProps = { categories: categoryOptions, params, bound, total, clearHref };

  return (
    <div className="lg:flex">
      <aside aria-label="Filtros" className="surface-slate hidden w-72 flex-none border-r border-border lg:-mb-20 lg:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin]">
          <CatalogFilters {...filterProps} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
       <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-2">
        <p className="eyebrow">Catálogo</p>
        <h1 className="text-3xl font-normal tracking-[-0.03em] sm:text-5xl">
          {params.q ? `Resultados para “${params.q}”` : 'Todos los productos'}
        </h1>
      </div>

      <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link
          href={buildHref(params, { categories: [] })}
          aria-current={params.categories.length === 0 ? 'true' : undefined}
          className={chipClass(params.categories.length === 0)}
        >
          Todos
          <span className="font-mono text-xs opacity-70">{all.length}</span>
        </Link>
        {categoryOptions.map((category) => {
          const active = params.categories.length === 1 && params.categories[0] === category.slug;
          return (
            <Link
              key={category.slug}
              href={buildHref(params, { categories: active ? [] : [category.slug] })}
              aria-current={active ? 'true' : undefined}
              className={chipClass(active)}
            >
              {category.name}
              <span className="font-mono text-xs opacity-70">{category.count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <section aria-label="Resultados" className="min-w-0">
          <CatalogControls params={params}>
            <MobileFilters {...filterProps} activeCount={activeCount} />
          </CatalogControls>

          <div className="mt-4 flex min-h-11 flex-wrap items-center gap-2">
            <p className="mr-2 text-sm text-muted-foreground" aria-live="polite">
              {total === 0 ? (
                <strong className="font-display text-base text-foreground">0</strong>
              ) : (
                <>
                  Mostrando{' '}
                  <strong className="font-display text-base text-foreground">
                    {from + 1}–{from + visible.length}
                  </strong>{' '}
                  de <strong className="font-display text-base text-foreground">{total}</strong>
                </>
              )}{' '}
              productos
            </p>
            {activeChips.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                scroll={false}
                aria-label={`Quitar filtro ${chip.label}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-accent bg-card pl-3.5 pr-2.5 text-[13px] font-medium transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ))}
            {activeChips.length > 1 && (
              <Link href={clearHref} scroll={false} className="inline-flex h-9 items-center px-2 text-[13px] font-medium text-accent underline-offset-4 hover:underline">
                Limpiar todo
              </Link>
            )}
          </div>

          <div className="mt-2">
            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center sm:p-14">
                <p className="eyebrow">Sin coincidencias</p>
                <h2 className="mt-2 text-2xl font-normal tracking-[-0.02em]">No encontramos productos</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prueba quitando algún filtro o ampliando el precio.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/productos">Ver todo el catálogo</Link>
                </Button>
              </div>
            ) : params.view === 'list' ? (
              <div className="flex flex-col gap-3">
                {visible.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} layout="list" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                {visible.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                hrefForPage={(target: number) => buildHref(params, { page: target })}
              />
              <p className="mt-3 text-center font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                Página {page} de {totalPages}
              </p>
            </div>
          )}
        </section>
      </div>
       </div>
      </div>
    </div>
  );
}
