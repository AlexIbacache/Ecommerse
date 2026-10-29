import Link from 'next/link';
import { CatalogControls } from '@/components/storefront/catalog-controls';
import { ProductCard } from '@/components/storefront/product-card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { getCategories, getProducts } from '@/lib/catalog';

interface StorefrontSearchParams {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<StorefrontSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      q: params.q,
      category: params.category,
      sort: params.sort,
      page,
      pageSize: 8,
    }),
  ]);

  function hrefForPage(target: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.sort) query.set('sort', params.sort);
    if (target > 1) query.set('page', String(target));
    const qs = query.toString();
    return qs ? `/productos?${qs}` : '/productos';
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-2">
        <p className="eyebrow">Catálogo</p>
        <h1 className="text-3xl font-normal tracking-[-0.03em] sm:text-5xl">
          {params.q ? `Resultados para “${params.q}”` : 'Todos los productos'}
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {products.meta.totalItems} productos
        </p>
      </div>

      <CatalogControls
        categories={categories}
        current={{ q: params.q, category: params.category, sort: params.sort }}
      />

      <div className="mt-8">
        {products.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center sm:p-14">
            <p className="eyebrow">Sin coincidencias</p>
            <h2 className="mt-2 text-2xl font-normal tracking-[-0.02em]">Sin resultados</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Probá con otra búsqueda o quitá los filtros.
            </p>
            <Button asChild className="mt-4">
              <Link href="/productos">Ver todo el catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.data.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>

      {products.meta.totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            page={products.meta.page}
            totalPages={products.meta.totalPages}
            hrefForPage={hrefForPage}
          />
        </div>
      )}
    </div>
  );
}
