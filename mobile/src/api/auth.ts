import apiClient from './client';
import { LoginResponse } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse & { token?: string }> => {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse & { token?: string } }>(
      '/auth/login',
      { email, password }
    );
    return response.data.data;
  },
};
