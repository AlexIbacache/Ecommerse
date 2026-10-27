import type { Category } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'CLIENTE' | 'ADMINISTRADOR';
}

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  errors?: FieldError[];

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (
    response.status === 401 &&
    retry &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/refresh')
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data?.message as string) ?? 'Error inesperado',
      (data?.errors as FieldError[]) ?? undefined,
    );
  }

  return data as T;
}

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    apiFetch<SessionUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    apiFetch<SessionUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  me: () => apiFetch<SessionUser>('/auth/me'),

  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};

export type CartIssue = 'NOT_FOUND' | 'INACTIVE' | 'INSUFFICIENT_STOCK';

export interface CartValidationItem {
  productId: number;
  requestedQuantity: number;
  name?: string;
  slug?: string;
  price?: string;
  stock?: number;
  isActive?: boolean;
  available?: boolean;
  priceChanged: boolean;
  issue?: CartIssue;
}

export interface CartValidation {
  valid: boolean;
  items: CartValidationItem[];
}

export const cartApi = {
  validate: (
    items: { productId: number; quantity: number; expectedPrice?: string }[],
  ) =>
    apiFetch<CartValidation>('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

export interface CommentItem {
  id: number;
  content: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface CommentList {
  data: CommentItem[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export const commentsApi = {
  list: (productId: number, page = 1, pageSize = 5) =>
    apiFetch<CommentList>(
      `/products/${productId}/comments?page=${page}&pageSize=${pageSize}`,
    ),
  create: (
    productId: number,
    input: { content: string; guestName?: string },
  ) =>
    apiFetch<CommentItem>(`/products/${productId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

export interface OrderItemDto {
  productId: number;
  name: string;
  slug: string;
  quantity: number;
  unitPrice: string;
}

export interface OrderDetail {
  id: number;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  items: OrderItemDto[];
  payment: { status: string; paypalOrderId: string | null } | null;
}

export interface OrderSummary {
  id: number;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  itemCount: number;
  paymentStatus: string | null;
}

export const ordersApi = {
  create: (items: { productId: number; quantity: number }[]) =>
    apiFetch<OrderDetail>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  list: () => apiFetch<OrderSummary[]>('/orders'),

  get: (id: number) => apiFetch<OrderDetail>(`/orders/${id}`),

  createPaypal: (id: number) =>
    apiFetch<{ orderId: number; paypalOrderId: string }>(
      `/orders/${id}/paypal`,
      { method: 'POST' },
    ),

  cancel: (id: number) =>
    apiFetch<OrderDetail>(`/orders/${id}/cancel`, { method: 'POST' }),
};

export const paymentsApi = {
  capture: (paypalOrderId: string) =>
    apiFetch<{ id: number; status: string; paymentStatus: string | null }>(
      '/payments/capture',
      {
        method: 'POST',
        body: JSON.stringify({ paypalOrderId }),
      },
    ),
};

export const usersApi = {
  me: () => apiFetch<SessionUser>('/users/me'),

  update: (input: { name?: string; email?: string }) =>
    apiFetch<SessionUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
};

export interface AdminMetrics {
  totalProducts: number;
  totalSales: number;
  revenue: string;
  recentOrders: {
    id: number;
    customerName: string;
    createdAt: string;
    total: string;
    status: string;
  }[];
  lowStock: { id: number; name: string; stock: number }[];
  statusDistribution: { status: string; count: number }[];
}

export const adminApi = {
  metrics: () => apiFetch<AdminMetrics>('/admin/metrics'),
};

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  isActive: boolean;
  available: boolean;
  image: string | null;
  category: { id: number; name: string; slug: string };
}

export interface AdminProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  isActive: boolean;
  categoryId: number;
  category: { id: number; name: string; slug: string };
  images: string[];
}

export interface AdminProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  stock: number;
  isActive: boolean;
  images: string[];
}

export interface AdminProductList {
  data: AdminProduct[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export const adminProductsApi = {
  list: (query: {
    q?: string;
    category?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.category) params.set('category', query.category);
    if (query.sort) params.set('sort', query.sort);
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    const qs = params.toString();
    return apiFetch<AdminProductList>(`/admin/products${qs ? `?${qs}` : ''}`);
  },

  get: (id: number) => apiFetch<AdminProductDetail>(`/admin/products/${id}`),

  create: (input: AdminProductInput) =>
    apiFetch<AdminProductDetail>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: number, input: Partial<AdminProductInput>) =>
    apiFetch<AdminProductDetail>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    apiFetch<{ deleted: boolean; deactivated: boolean }>(
      `/admin/products/${id}`,
      { method: 'DELETE' },
    ),
};

export const categoriesApi = {
  list: () => apiFetch<Category[]>('/categories'),
};

export interface AdminOrderSummary {
  id: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  total: string;
  status: string;
  paymentStatus: string | null;
}

export interface AdminOrderDetail {
  id: number;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  customer: { id: number; name: string; email: string };
  items: {
    productId: number;
    name: string;
    slug: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }[];
  payment: {
    status: string;
    paypalOrderId: string | null;
    paypalCaptureId: string | null;
    amount: string;
  } | null;
}

export interface AdminOrderList {
  data: AdminOrderSummary[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export const adminOrdersApi = {
  list: (page = 1, pageSize = 10) =>
    apiFetch<AdminOrderList>(
      `/admin/orders?page=${page}&pageSize=${pageSize}`,
    ),
  get: (id: number) => apiFetch<AdminOrderDetail>(`/admin/orders/${id}`),
};

export interface AdminComment {
  id: number;
  content: string;
  authorName: string;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  product: { id: number; name: string; slug: string };
}

export interface AdminCommentList {
  data: AdminComment[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export const adminCommentsApi = {
  list: (page = 1, pageSize = 10) =>
    apiFetch<AdminCommentList>(
      `/admin/comments?page=${page}&pageSize=${pageSize}`,
    ),
  setStatus: (id: number, status: 'VISIBLE' | 'OCULTO') =>
    apiFetch<{ id: number; status: string }>(`/admin/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  remove: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/admin/comments/${id}`, {
      method: 'DELETE',
    }),
};
