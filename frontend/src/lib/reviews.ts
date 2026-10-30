import { apiFetch } from '@/lib/api';
import type { PaginationMeta, RatingSummary } from '@/lib/types';

export interface ReviewItem {
  id: number;
  content: string;
  authorName: string;
  isAnonymous: boolean;
  /** Puntuación 1-5; null si el comentario no incluye puntuación. */
  rating: number | null;
  createdAt: string;
}

export interface RatingBreakdown extends RatingSummary {
  /** Cantidad de puntuaciones por estrella, índice 0 = 1 estrella. */
  distribution: number[];
}

export interface ReviewList {
  summary: RatingBreakdown;
  data: ReviewItem[];
  meta: PaginationMeta;
}

export interface ReviewInput {
  content: string;
  guestName?: string;
  rating?: number;
  /** Campo trampa anti-bots: siempre vacío cuando escribe una persona. */
  website?: string;
}

export const reviewsApi = {
  list: (productId: number, page = 1, pageSize = 5) =>
    apiFetch<ReviewList>(`/products/${productId}/comments?page=${page}&pageSize=${pageSize}`),
  create: (productId: number, input: ReviewInput) =>
    apiFetch<ReviewItem>(`/products/${productId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
