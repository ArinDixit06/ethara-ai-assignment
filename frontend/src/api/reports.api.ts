import api from './axiosInstance';

export const reportsApi = {
  getInventoryValuation: async (): Promise<any> => {
    const response = await api.get('/reports/inventory-valuation');
    return response.data.data;
  },

  getStockMovements: async (params?: any): Promise<any> => {
    const response = await api.get('/reports/stock-movements', { params });
    return response.data.data;
  },

  getLowStock: async (): Promise<any> => {
    const response = await api.get('/reports/low-stock');
    return response.data.data;
  },

  getOrderSummary: async (): Promise<any> => {
    const response = await api.get('/reports/order-summary');
    return response.data.data;
  },

  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/reports/dashboard-stats');
    return response.data.data;
  },
};

export default reportsApi;
