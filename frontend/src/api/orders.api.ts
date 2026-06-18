import api from './axiosInstance';
import { Order, OrderQueryParams, CreateOrderInput } from '../types/order.types';

export const ordersApi = {
  getAll: async (params?: OrderQueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/orders', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  create: async (payload: CreateOrderInput): Promise<Order> => {
    const response = await api.post('/orders', payload);
    return response.data.data;
  },

  update: async (id: string, payload: any): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  // State transitions
  confirm: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/confirm`);
    return response.data.data;
  },

  ship: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/ship`);
    return response.data.data;
  },

  receive: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/receive`);
    return response.data.data;
  },

  pack: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/pack`);
    return response.data.data;
  },

  dispatch: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/dispatch`);
    return response.data.data;
  },

  fulfill: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/fulfill`);
    return response.data.data;
  },

  cancel: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data.data;
  },
};

export default ordersApi;
