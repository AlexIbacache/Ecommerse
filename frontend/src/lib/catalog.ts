import type {
  Category,
  Paginated,
  ProductDetail,
  ProductListItem,
  ProductQuery,
} from './types';

const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar ${path}`);
  }

  return (await response.json()) as T;
}

export function getCategories(): Promise<Category[]> {
  return getJson<Category[]>('/categories');
}

export function getProducts(
  query: ProductQuery = {},
): Promise<Paginated<ProductListItem>> {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const qs = params.toString();
  return getJson<Paginated<ProductListItem>>(`/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return getJson<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}

export async function getProductOrNull(
  slug: string,
): Promise<ProductDetail | null> {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(slug)}`,
    { cache: 'no-store' },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar el producto`);
  }

  return (await response.json()) as ProductDetail;
}
