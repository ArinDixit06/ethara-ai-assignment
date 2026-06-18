import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional().nullable(),
  description: z.string().optional().nullable(),
  unitPrice: z.coerce.number().min(0, 'Unit price must be greater than or equal to 0'),
  costPrice: z.coerce.number().min(0, 'Cost price must be greater than or equal to 0'),
  unitOfMeasure: z.string().optional().default('pcs'),
  reorderThreshold: z.coerce.number().int().min(0, 'Reorder threshold must be an integer >= 0').optional().default(10),
  currentStock: z.coerce.number().int().min(0, 'Current stock must be an integer >= 0').optional().default(0),
  isActive: z.boolean().optional().default(true),
  supplierIds: z.array(z.string().min(1)).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional().nullable(),
  description: z.string().optional().nullable(),
  unitPrice: z.coerce.number().min(0, 'Unit price must be >= 0').optional(),
  costPrice: z.coerce.number().min(0, 'Cost price must be >= 0').optional(),
  unitOfMeasure: z.string().optional(),
  reorderThreshold: z.coerce.number().int().min(0, 'Reorder threshold must be an integer >= 0').optional(),
  currentStock: z.coerce.number().int().min(0, 'Current stock must be an integer >= 0').optional(),
  isActive: z.boolean().optional(),
  supplierIds: z.array(z.string().min(1)).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = {
  search?: string;
  categoryId?: string;
  isActive?: string;
  lowStock?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
