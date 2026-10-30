import { apiFetch } from '@/lib/api';

export interface DailySalesPoint {
  /** Día en UTC, formato YYYY-MM-DD. */
  date: string;
  revenue: string;
  orders: number;
}

export interface DailySales {
  days: number;
  series: DailySalesPoint[];
  totals: { revenue: string; orders: number };
}

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRODUCT_DEACTIVATED'
  | 'COMMENT_HIDDEN'
  | 'COMMENT_RESTORED'
  | 'COMMENT_DELETED';

export interface AuditEntry {
  id: number;
  action: AuditAction;
  entityType: 'PRODUCT' | 'COMMENT';
  entityId: number | null;
  summary: string;
  details: string | null;
  actor: { id: number; name: string; email: string } | null;
  createdAt: string;
}

export interface AuditList {
  data: AuditEntry[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export const adminInsightsApi = {
  dailySales: (days = 30) => apiFetch<DailySales>(`/admin/sales/daily?days=${days}`),
  audit: (page = 1, pageSize = 15) =>
    apiFetch<AuditList>(`/admin/audit?page=${page}&pageSize=${pageSize}`),
};
