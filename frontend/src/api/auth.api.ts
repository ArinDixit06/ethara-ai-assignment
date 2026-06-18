import api from './axiosInstance';
import { AuthResponse, User } from '../types/auth.types';

export const authApi = {
  login: async (payload: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', payload);
    return response.data.data;
  },

  register: async (payload: any): Promise<User> => {
    const response = await api.post('/auth/register', payload);
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },
};

export default authApi;
