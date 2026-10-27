import { z } from 'zod';

const imageUrl = z.string().trim().url('Cada imagen debe ser una URL válida');

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120),
  description: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000),
  price: z.coerce
    .number()
    .positive('El precio debe ser mayor a cero')
    .max(999_999.99),
  categoryId: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').max(100_000),
  isActive: z.boolean().optional().default(true),
  images: z
    .array(imageUrl)
    .min(1, 'Agregá al menos una imagen')
    .max(5, 'Máximo 5 imágenes'),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  price: z.coerce.number().positive().max(999_999.99).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().min(0).max(100_000).optional(),
  isActive: z.boolean().optional(),
  images: z.array(imageUrl).min(1).max(5).optional(),
});

export const adminProductQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  sort: z
    .enum(['createdAt_desc', 'name_asc', 'price_asc', 'price_desc', 'stock_asc'])
    .default('createdAt_desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type AdminProductQueryDto = z.infer<typeof adminProductQuerySchema>;
