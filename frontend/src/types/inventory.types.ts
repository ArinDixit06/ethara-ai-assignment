import { Product } from './product.types';

export type MovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';
export type AdjustmentType = 'ADD' | 'REMOVE' | 'SET';

export interface StockMovement {
  id: string;
  productId: string;
  product: Product;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId: string | null;
  notes: string | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface StockMovementQueryParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockAdjustmentInput {
  productId: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
}
