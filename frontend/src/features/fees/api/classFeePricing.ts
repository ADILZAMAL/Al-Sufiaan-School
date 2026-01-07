import { 
  ClassFeePricing, 
  ClassFeePricingResponse, 
  ClassFeePricingByClassResponse,
  CreateClassFeePricingRequest, 
  UpdateClassFeePricingRequest,
  BulkUpsertClassFeePricingRequest,
  BulkOperationResponse,
  CopyPricingRequest,
  CopyPricingResponse,
  ClassFeePricingFilters 
} from '../types';

const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
const API_BASE_URL = `${BASE_URL}/api/class-fee-pricing`;

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  return searchParams.toString();
};

// Helper function for API calls
const apiCall = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const classFeePricingApi = {
  // Create new class fee pricing
  create: async (data: CreateClassFeePricingRequest): Promise<ClassFeePricing> => {
    const response = await apiCall<ClassFeePricingResponse>(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as ClassFeePricing;
  },

  // Get all class fee pricing with optional filters
  getAll: async (filters?: ClassFeePricingFilters): Promise<ClassFeePricing[]> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    
    const response = await apiCall<ClassFeePricingResponse>(url);
    return response.data as ClassFeePricing[];
  },

  // Get class fee pricing by ID
  getById: async (id: number): Promise<ClassFeePricing> => {
    const response = await apiCall<ClassFeePricingResponse>(`${API_BASE_URL}/${id}`);
    return response.data as ClassFeePricing;
  },

  // Get fee pricing for a specific class
  getByClass: async (classId: number, academicYear?: string): Promise<{
    classFeePricing: ClassFeePricing[];
    totalAmount: number;
    classId: number;
    academicYear: string;
  }> => {
    const queryString = academicYear ? buildQueryString({ academicYear }) : '';
    const url = queryString 
      ? `${API_BASE_URL}/class/${classId}?${queryString}` 
      : `${API_BASE_URL}/class/${classId}`;
    
    const response = await apiCall<ClassFeePricingByClassResponse>(url);
    return response.data;
  },

  // Update class fee pricing
  update: async (id: number, data: UpdateClassFeePricingRequest): Promise<ClassFeePricing> => {
    const response = await apiCall<ClassFeePricingResponse>(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data as ClassFeePricing;
  },

  // Delete class fee pricing (soft delete)
  delete: async (id: number): Promise<void> => {
    await apiCall(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk create/update class fee pricing
  bulkUpsert: async (data: BulkUpsertClassFeePricingRequest): Promise<Array<{
    action: 'created' | 'updated';
    id: number;
  }>> => {
    const response = await apiCall<BulkOperationResponse>(`${API_BASE_URL}/bulk-upsert`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Copy pricing from one academic year to another
  copyPricing: async (data: CopyPricingRequest): Promise<{
    copiedCount: number;
    fromYear: string;
    toYear: string;
  }> => {
    const response = await apiCall<CopyPricingResponse>(`${API_BASE_URL}/copy-pricing`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },
};

// Classes API
export const classesApi = {
  // Get all classes
  getAll: async (): Promise<any[]> => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
      credentials: "include"
    });
    const body = await response.json();
    if (!body.success) {
      throw new Error(body.error.message);
    }
    return body.data;
  },
};

// Utility functions for common operations
export const classFeePricingUtils = {
  // Calculate total amount for a class
  calculateClassTotal: (pricingData: ClassFeePricing[]): number => {
    return pricingData.reduce((total, pricing) => total + Number(pricing.amount), 0);
  },

  // Group pricing by class
  groupByClass: (pricingData: ClassFeePricing[]): Record<number, ClassFeePricing[]> => {
    return pricingData.reduce((groups, pricing) => {
      const classId = pricing.classId;
      if (!groups[classId]) {
        groups[classId] = [];
      }
      groups[classId].push(pricing);
      return groups;
    }, {} as Record<number, ClassFeePricing[]>);
  },

  // Group pricing by academic year
  groupByAcademicYear: (pricingData: ClassFeePricing[]): Record<string, ClassFeePricing[]> => {
    return pricingData.reduce((groups, pricing) => {
      const year = pricing.academicYear;
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(pricing);
      return groups;
    }, {} as Record<string, ClassFeePricing[]>);
  },

  // Format amount for display
  formatAmount: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Generate academic year options
  generateAcademicYears: (startYear?: number, count: number = 5): Array<{ value: string; label: string }> => {
    const currentYear = startYear || new Date().getFullYear();
    const years = [];
    
    for (let i = 0; i < count; i++) {
      const year = currentYear + i;
      const nextYear = year + 1;
      const value = `${year}-${nextYear.toString().slice(-2)}`;
      const label = `${year}-${nextYear}`;
      years.push({ value, label });
    }
    
    return years;
  },

  // Validate academic year format
  isValidAcademicYear: (year: string): boolean => {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(year);
  },

  // Get current academic year
  getCurrentAcademicYear: (): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Assuming academic year starts in April (month 4)
    if (currentMonth >= 4) {
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    }
  },
};

export default classFeePricingApi;
