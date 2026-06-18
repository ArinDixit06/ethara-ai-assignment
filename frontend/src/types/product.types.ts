import { Supplier } from './supplier.types';

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductSupplier {
  productId: string;
  supplierId: string;
  supplier: Supplier;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  category: Category | null;
  description: string | null;
  unitPrice: number;
  costPrice: number;
  unitOfMeasure: string;
  reorderThreshold: number;
  currentStock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  suppliers: ProductSupplier[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: string;
  lowStock?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  categoryId?: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  unitOfMeasure: string;
  reorderThreshold: number;
  currentStock?: number; // only on create
  supplierIds?: string[];
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  categoryId?: string;
  description?: string;
  unitPrice?: number;
  costPrice?: number;
  unitOfMeasure?: string;
  reorderThreshold?: number;
  supplierIds?: string[];
  isActive?: boolean;
}
