export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface RatingSummary {
  /** Promedio con un decimal; null si todavía no hay puntuaciones. */
  average: number | null;
  count: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  available: boolean;
  image: string | null;
  category: Category;
  rating?: RatingSummary;
}

export interface ProductImage {
  id: number;
  url: string;
  position: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  available: boolean;
  category: Category;
  images: ProductImage[];
  rating?: RatingSummary;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}
