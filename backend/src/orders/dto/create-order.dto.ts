import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().max(100),
      }),
    )
    .min(1, 'El pedido no puede estar vacío')
    .max(50),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
