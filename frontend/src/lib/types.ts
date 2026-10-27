export interface Category {
  id: number;
  name: string;
  slug: string;
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
