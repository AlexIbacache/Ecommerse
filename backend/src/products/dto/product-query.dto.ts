import { z } from 'zod';

export const productSortSchema = z.enum([
  'price_asc',
  'price_desc',
  'name_asc',
  'createdAt_desc',
]);

export const productQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  sort: productSortSchema.default('createdAt_desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export type ProductQueryDto = z.infer<typeof productQuerySchema>;
