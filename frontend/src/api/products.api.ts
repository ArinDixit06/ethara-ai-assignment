import api from './axiosInstance';
import { Product, ProductQueryParams, CreateProductInput, UpdateProductInput, Category } from '../types/product.types';

export const productsApi = {
  getAll: async (params?: ProductQueryParams): Promise<{ data: Product[]; meta: any }> => {
    const response = await api.get('/products', { params });
    // Returns wrapped success response: { success: true, message: ..., data: [...], meta: {...} }
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  create: async (payload: CreateProductInput): Promise<Product> => {
    const response = await api.post('/products', payload);
    return response.data.data;
  },

  update: async (id: string, payload: UpdateProductInput): Promise<Product> => {
    const response = await api.put(`/products/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: string): Promise<Product> => {
    const response = await api.delete(`/products/${id}`);
    return response.data.data;
  },

  uploadImage: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/products/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  exportCSV: async (): Promise<Blob> => {
    const response = await api.get('/products/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Category endpoints
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.data;
  },

  createCategory: async (name: string): Promise<Category> => {
    const response = await api.post('/categories', { name });
    return response.data.data;
  },
};

export default productsApi;
