import api from './axiosInstance';
import { Supplier, SupplierQueryParams, CreateSupplierInput, UpdateSupplierInput } from '../types/supplier.types';

export const suppliersApi = {
  getAll: async (params?: SupplierQueryParams): Promise<{ data: Supplier[]; meta: any }> => {
    const response = await api.get('/suppliers', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.data;
  },

  create: async (payload: CreateSupplierInput): Promise<Supplier> => {
    const response = await api.post('/suppliers', payload);
    return response.data.data;
  },

  update: async (id: string, payload: UpdateSupplierInput): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: string): Promise<Supplier> => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data.data;
  },
};

export default suppliersApi;
