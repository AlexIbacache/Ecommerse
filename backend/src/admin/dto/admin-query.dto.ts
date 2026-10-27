import { z } from 'zod';

export const adminPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const updateCommentStatusSchema = z.object({
  status: z.enum(['VISIBLE', 'OCULTO']),
});

export type AdminPageQueryDto = z.infer<typeof adminPageQuerySchema>;
export type UpdateCommentStatusDto = z.infer<typeof updateCommentStatusSchema>;
