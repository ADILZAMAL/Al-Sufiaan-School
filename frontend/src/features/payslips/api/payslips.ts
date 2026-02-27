import { 
  Payslip, 
  PayslipFormData, 
  PayslipListResponse, 
  PayslipExistsResponse,
  PayslipWithPayments,
  PaymentFormData,
  PaymentResponse,
  PayslipPayment
} from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export const payslipApi = {
  // Generate new payslip
  generate: async (data: PayslipFormData): Promise<Payslip> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to generate payslip');
    }
    return body.data;
  },

  // Get all payslips for a specific staff member
  getByStaff: async (staffId: number, page = 1, limit = 10): Promise<PayslipListResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/staff/${staffId}?page=${page}&limit=${limit}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch payslips');
    }
    return body.data;
  },

  // Get payslip by ID
  getById: async (id: number): Promise<Payslip> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/${id}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch payslip');
    }
    return body.data;
  },

  // Check if payslip exists for staff/month/year
  checkExists: async (staffId: number, month: number, year: number): Promise<PayslipExistsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/check/${staffId}/${month}/${year}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to check payslip existence');
    }
    return body.data;
  },

  // Get all payslips for a school (with optional filters)
  getAll: async (schoolId: number, filters?: { month?: number; year?: number; page?: number; limit?: number }): Promise<PayslipListResponse> => {
    const params = new URLSearchParams({
      schoolId: schoolId.toString(),
      ...(filters?.month && { month: filters.month.toString() }),
      ...(filters?.year && { year: filters.year.toString() }),
      ...(filters?.page && { page: filters.page.toString() }),
      ...(filters?.limit && { limit: filters.limit.toString() })
    });

    const response = await fetch(`${API_BASE_URL}/api/payslips/all?${params}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch payslips');
    }
    return body.data;
  },

  // Delete payslip
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to delete payslip');
    }
  },

  // Calculate salary preview (client-side calculation)
  calculateSalary: (baseSalary: number, absentDays: number, halfDays: number, deductions: number) => {
    const perDaySalary = baseSalary / 30;
    // Using the new logic: effective salary days = 30 - absent - (half day)/2
    const effectiveSalaryDays = 30 - absentDays - (halfDays * 0.5);
    const grossSalary = perDaySalary * effectiveSalaryDays;
    const netSalary = grossSalary - deductions;

    return {
      baseSalary,
      perDaySalary: Math.round(perDaySalary * 100) / 100,
      totalDays: 30,
      presentDays: Math.round(effectiveSalaryDays * 10) / 10,
      grossSalary: Math.round(grossSalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100
    };
  },

  // Payment Management APIs
  
  // Get payslip with payment details
  getWithPayments: async (id: number): Promise<PayslipWithPayments> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/${id}/with-payments`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch payslip with payments');
    }
    return body.data;
  },

  // Get payment history for a payslip
  getPaymentHistory: async (id: number): Promise<{ payslip: PayslipWithPayments; payments: PayslipPayment[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/${id}/payments`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch payment history');
    }
    return body.data;
  },

  // Make a payment for a payslip
  makePayment: async (id: number, paymentData: PaymentFormData): Promise<PaymentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/${id}/payments`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to make payment');
    }
    return body.data;
  },

  // Delete a payment
  deletePayment: async (payslipId: number, paymentId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/${payslipId}/payments/${paymentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to delete payment');
    }
  },

  // Get next available month for payslip generation
  getNextAvailableMonth: async (staffId: number): Promise<{
    nextAvailableMonth: number;
    nextAvailableYear: number;
    nextAvailableMonthName: string;
    lastGeneratedMonth: string | null;
    canGenerate: boolean;
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/payslips/staff/${staffId}/next-available-month`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to get next available month');
    }
    return body.data;
  }
};
