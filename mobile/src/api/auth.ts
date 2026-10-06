import apiClient from './client';
import { LoginResponse } from '../types';

export const authApi = {
  login: async (mobileNumber: string, password: string): Promise<LoginResponse & { token?: string }> => {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse & { token?: string } }>(
      '/auth/login',
      // `client: 'mobile'` gets a longer-lived token than the web session
      { mobileNumber, password, client: 'mobile' }
    );
    return response.data.data;
  },

  /** Confirms the session is still valid and returns fresh user info. */
  validateToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.get<{ success: boolean; data: LoginResponse }>('/auth/validate-token');
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },
};
