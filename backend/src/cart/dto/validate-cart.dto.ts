import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(100),
  expectedPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Formato de precio inválido')
    .optional(),
});

export const validateCartSchema = z.object({
  items: z
    .array(cartItemSchema)
    .min(1, 'El carrito no puede estar vacío')
    .max(50),
});

export type ValidateCartDto = z.infer<typeof validateCartSchema>;
