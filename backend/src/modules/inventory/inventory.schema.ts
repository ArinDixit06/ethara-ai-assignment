import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional().nullable(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
