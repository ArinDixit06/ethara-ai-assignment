import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdjustmentType = 'ADD' | 'REMOVE' | 'SET';

export interface StockAdjustmentRequest {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  unitOfMeasure: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  status: RequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface StockRequestState {
  requests: StockAdjustmentRequest[];
  addRequest: (req: Omit<StockAdjustmentRequest, 'id' | 'requestedAt' | 'status'>) => string;
  approveRequest: (id: string, adminName: string) => StockAdjustmentRequest | null;
  rejectRequest: (id: string, adminName: string, reason: string) => void;
  getPendingCount: () => number;
}

export const useStockRequestStore = create<StockRequestState>()(
  persist(
    (set, get) => ({
      requests: [],

      addRequest: (req) => {
        const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newRequest: StockAdjustmentRequest = {
          ...req,
          id,
          requestedAt: new Date().toISOString(),
          status: 'PENDING',
        };
        set((state) => ({ requests: [newRequest, ...state.requests] }));
        return id;
      },

      approveRequest: (id, adminName) => {
        let found: StockAdjustmentRequest | null = null;
        set((state) => ({
          requests: state.requests.map((r) => {
            if (r.id === id) {
              found = { ...r, status: 'APPROVED', reviewedBy: adminName, reviewedAt: new Date().toISOString() };
              return found;
            }
            return r;
          }),
        }));
        return found;
      },

      rejectRequest: (id, adminName, reason) => {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? { ...r, status: 'REJECTED', reviewedBy: adminName, reviewedAt: new Date().toISOString(), rejectionReason: reason }
              : r
          ),
        }));
      },

      getPendingCount: () => {
        return get().requests.filter((r) => r.status === 'PENDING').length;
      },
    }),
    {
      name: 'stock-adjustment-requests',
    }
  )
);

export default useStockRequestStore;
