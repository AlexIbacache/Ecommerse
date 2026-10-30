import { z } from 'zod';

export const adminPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const dailySalesQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
});

export const updateCommentStatusSchema = z.object({
  status: z.enum(['VISIBLE', 'OCULTO']),
});

export type AdminPageQueryDto = z.infer<typeof adminPageQuerySchema>;
export type DailySalesQueryDto = z.infer<typeof dailySalesQuerySchema>;
export type UpdateCommentStatusDto = z.infer<typeof updateCommentStatusSchema>;
