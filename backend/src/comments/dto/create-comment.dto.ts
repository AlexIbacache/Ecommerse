import { z } from 'zod';

const MAX_LINKS = 1;
const LINK_PATTERN = /(?:https?:\/\/|www\.)\S+/gi;
// Un mismo carácter repetido 15 veces seguidas o más (spam, "aaaaaaaa", "!!!!!!!!").
const FLOOD_PATTERN = /(.)\1{14,}/su;

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, 'El comentario debe tener al menos 3 caracteres')
    .max(1000, 'El comentario no puede superar 1000 caracteres')
    .refine(
      (value) => (value.match(LINK_PATTERN)?.length ?? 0) <= MAX_LINKS,
      'El comentario no puede incluir más de 1 enlace',
    )
    .refine(
      (value) => !FLOOD_PATTERN.test(value),
      'El comentario repite demasiado un mismo carácter',
    ),
  guestName: z
    .string()
    .trim()
    .min(2, 'Indica un nombre de al menos 2 caracteres')
    .max(60, 'El nombre no puede superar 60 caracteres')
    .optional(),
  rating: z
    .number({ invalid_type_error: 'La puntuación debe ser un número' })
    .int('La puntuación debe ser un número entero')
    .min(1, 'La puntuación mínima es 1')
    .max(5, 'La puntuación máxima es 5')
    .optional(),
  /** Campo trampa: las personas no lo ven ni lo completan; los bots suelen rellenarlo. */
  website: z.string().max(200).optional(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
