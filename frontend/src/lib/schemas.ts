import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, 'Escribe al menos 3 caracteres')
    .max(1000, 'El comentario no puede superar 1000 caracteres')
    .refine(
      (value) => (value.match(/(?:https?:\/\/|www\.)\S+/gi)?.length ?? 0) <= 1,
      'El comentario no puede incluir más de 1 enlace',
    )
    .refine((value) => !/(.)\1{14,}/su.test(value), 'El comentario repite demasiado un mismo carácter'),
  guestName: z.string().trim().max(60, 'Máximo 60 caracteres').optional(),
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
});

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  description: z.string().trim().min(10, 'Mínimo 10 caracteres').max(2000),
  price: z.coerce.number().positive('El precio debe ser mayor a cero').max(999_999.99),
  categoryId: z.coerce.number().int().positive('Elige una categoría'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').max(100_000),
  isActive: z.boolean(),
  images: z
    .array(z.string().trim().url('Cada imagen debe ser una URL válida'))
    .min(1, 'Agrega al menos una imagen')
    .max(5, 'Máximo 5 imágenes'),
});
