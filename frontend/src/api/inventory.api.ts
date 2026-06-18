import api from './axiosInstance';
import { Product } from '../types/product.types';
import { StockMovement, StockMovementQueryParams, StockAdjustmentInput } from '../types/inventory.types';

export const inventoryApi = {
  getInventory: async (params?: any): Promise<{ data: Product[]; meta: any }> => {
    const response = await api.get('/inventory', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  adjustStock: async (payload: StockAdjustmentInput): Promise<{ product: Product; movement: StockMovement }> => {
    const response = await api.post('/inventory/adjust', payload);
    return response.data.data;
  },

  getMovements: async (params?: StockMovementQueryParams): Promise<{ data: StockMovement[]; meta: any }> => {
    const response = await api.get('/inventory/movements', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await api.get('/inventory/low-stock');
    return response.data.data;
  },

  getValuation: async (): Promise<{ totalInventoryValue: number }> => {
    const response = await api.get('/inventory/valuation');
    return response.data.data;
  },

  exportMovementsCSV: async (params?: StockMovementQueryParams): Promise<Blob> => {
    const response = await api.get('/inventory/movements/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default inventoryApi;
