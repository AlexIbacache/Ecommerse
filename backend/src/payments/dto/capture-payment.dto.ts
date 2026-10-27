import { z } from 'zod';

export const capturePaymentSchema = z.object({
  paypalOrderId: z.string().trim().min(1).max(64),
});

export type CapturePaymentDto = z.infer<typeof capturePaymentSchema>;
