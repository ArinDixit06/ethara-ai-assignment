import { Product } from './product.types';
import { Supplier } from './supplier.types';

export type OrderType = 'PURCHASE' | 'SALES';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'FULFILLED' | 'CANCELLED';

export interface OrderLineItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  supplierId: string | null;
  supplier: Supplier | null;
  customerName: string | null;
  customerContact: string | null;
  notes: string | null;
  totalAmount: number;
  expectedDate: string | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  lineItems: OrderLineItem[];
  statusHistory: OrderStatusHistory[];
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  type?: OrderType;
  status?: OrderStatus;
  supplierId?: string;
}

export interface CreateOrderLineItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  type: OrderType;
  supplierId?: string;
  customerName?: string;
  customerContact?: string;
  notes?: string;
  expectedDate?: string;
  lineItems: CreateOrderLineItemInput[];
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  notes?: string; // status history update notes
}
