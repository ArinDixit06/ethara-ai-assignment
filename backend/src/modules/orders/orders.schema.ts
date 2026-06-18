import { z } from 'zod';
import { OrderType } from '@prisma/client';

const orderLineItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be greater than or equal to 0'),
});

export const createOrderSchema = z.object({
  type: z.nativeEnum(OrderType),
  supplierId: z.string().min(1, 'Supplier ID is required').optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expectedDate: z.string().transform((val) => (val ? new Date(val) : null)).optional().nullable(),
  lineItems: z.array(orderLineItemSchema).min(1, 'Order must contain at least one line item'),
});

export const updateOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required').optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expectedDate: z.string().transform((val) => (val ? new Date(val) : null)).optional().nullable(),
  lineItems: z.array(orderLineItemSchema).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderLineInput = z.infer<typeof orderLineItemSchema>;
