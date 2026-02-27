import apiClient from './client';
import { Payslip, PayslipListResponse, PayslipWithPayments } from '../types';

export const payslipApi = {
  getMyPayslips: async (
    staffId: number,
    page = 1,
    limit = 20
  ): Promise<PayslipListResponse> => {
    const response = await apiClient.get(`/payslips/staff/${staffId}`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  getPayslipWithPayments: async (id: number): Promise<PayslipWithPayments> => {
    const response = await apiClient.get(`/payslips/${id}/with-payments`);
    return response.data.data;
  },
};
