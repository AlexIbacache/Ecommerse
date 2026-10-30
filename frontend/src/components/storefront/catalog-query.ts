export const DEFAULT_SORT = 'createdAt_desc';
export const PAGE_SIZE = 12;

export type CatalogView = 'grid' | 'list';

export interface CatalogParams {
  q?: string;
  categories: string[];
  sort: string;
  /** Precio máximo; undefined = sin límite. */
  max?: number;
  stock: boolean;
  low: boolean;
  view: CatalogView;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseParams(raw: RawParams): CatalogParams {
  const max = Number(first(raw.max));
  const page = Number(first(raw.page));

  return {
    q: first(raw.q)?.trim() || undefined,
    categories: (first(raw.category) ?? '').split(',').map((slug) => slug.trim()).filter(Boolean),
    sort: first(raw.sort) || DEFAULT_SORT,
    max: Number.isFinite(max) && max > 0 ? max : undefined,
    stock: first(raw.stock) === '1',
    low: first(raw.low) === '1',
    view: first(raw.vista) === 'lista' ? 'list' : 'grid',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Construye la URL del catálogo. Cualquier cambio de filtros vuelve a la página 1. */
export function buildHref(current: CatalogParams, patch: Partial<CatalogParams> = {}): string {
  const next: CatalogParams = { ...current, page: 1, ...patch };
  const query = new URLSearchParams();

  if (next.q) query.set('q', next.q);
  if (next.categories.length > 0) query.set('category', next.categories.join(','));
  if (next.sort !== DEFAULT_SORT) query.set('sort', next.sort);
  if (next.max !== undefined) query.set('max', String(next.max));
  if (next.stock) query.set('stock', '1');
  if (next.low) query.set('low', '1');
  if (next.view === 'list') query.set('vista', 'lista');
  if (next.page > 1) query.set('page', String(next.page));

  const qs = query.toString();
  return qs ? `/productos?${qs}` : '/productos';
}

export function countActiveFilters(params: CatalogParams, bound: number): number {
  return (
    params.categories.length +
    (params.max !== undefined && params.max < bound ? 1 : 0) +
    (params.stock ? 1 : 0) +
    (params.low ? 1 : 0) +
    (params.q ? 1 : 0)
  );
}
