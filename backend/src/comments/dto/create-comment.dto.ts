import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, 'El comentario debe tener al menos 3 caracteres')
    .max(1000, 'El comentario no puede superar 1000 caracteres'),
  guestName: z
    .string()
    .trim()
    .min(2, 'Indica un nombre de al menos 2 caracteres')
    .max(60, 'El nombre no puede superar 60 caracteres')
    .optional(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
