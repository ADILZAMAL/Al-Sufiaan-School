import apiClient from './client';
import { LoginResponse } from '../types';

export const authApi = {
  login: async (mobileNumber: string, password: string): Promise<LoginResponse & { token?: string }> => {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse & { token?: string } }>(
      '/auth/login',
      { mobileNumber, password }
    );
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },
};
