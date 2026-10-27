import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede superar 100 caracteres')
      .optional(),
    email: z.string().trim().toLowerCase().email('Email inválido').optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'Enviá al menos un campo para actualizar',
  });

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
