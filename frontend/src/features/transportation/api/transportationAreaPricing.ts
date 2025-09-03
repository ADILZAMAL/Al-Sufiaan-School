import { 
  TransportationAreaPricing,
  CreateTransportationAreaPricingRequest,
  UpdateTransportationAreaPricingRequest,
  BulkUpsertTransportationAreaPricingRequest,
  CopyTransportationPricingRequest,
  TransportationAreaPricingFilters,
  TransportationAreaPricingListResponse,
  TransportationAreaPricingResponse,
  TransportationAreaPricingByAreaResponse,
  BulkOperationResponse,
  CopyPricingResponse,
  TransportationAreaPricingStatsResponse
} from '../types';

const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
const API_BASE_URL = `${BASE_URL}/api/transportation-area-pricing`;

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

export const transportationAreaPricingApi = {
  // Create new transportation area pricing
  create: async (data: CreateTransportationAreaPricingRequest): Promise<TransportationAreaPricing> => {
    const response = await apiCall<TransportationAreaPricingResponse>(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as TransportationAreaPricing;
  },

  // Get all transportation area pricing with optional filters and pagination
  getAll: async (filters?: TransportationAreaPricingFilters): Promise<{
    transportationAreaPricing: TransportationAreaPricing[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    
    const response = await apiCall<TransportationAreaPricingListResponse>(url);
    return response.data;
  },

  // Get transportation area pricing by ID
  getById: async (id: number): Promise<TransportationAreaPricing> => {
    const response = await apiCall<TransportationAreaPricingResponse>(`${API_BASE_URL}/${id}`);
    return response.data as TransportationAreaPricing;
  },

  // Get transportation area pricing by area name
  getByArea: async (areaName: string, academicYear?: string): Promise<{
    transportationAreaPricing: TransportationAreaPricing[];
    totalAmount: number;
    areaName: string;
    academicYear: string;
  }> => {
    const queryString = academicYear ? buildQueryString({ academicYear }) : '';
    const url = queryString 
      ? `${API_BASE_URL}/area/${encodeURIComponent(areaName)}?${queryString}`
      : `${API_BASE_URL}/area/${encodeURIComponent(areaName)}`;
    
    const response = await apiCall<TransportationAreaPricingByAreaResponse>(url);
    return response.data;
  },

  // Update transportation area pricing
  update: async (id: number, data: UpdateTransportationAreaPricingRequest): Promise<TransportationAreaPricing> => {
    const response = await apiCall<TransportationAreaPricingResponse>(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data as TransportationAreaPricing;
  },

  // Delete transportation area pricing
  delete: async (id: number): Promise<void> => {
    await apiCall(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk create/update transportation area pricing
  bulkUpsert: async (data: BulkUpsertTransportationAreaPricingRequest): Promise<Array<{
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
  copyPricing: async (data: CopyTransportationPricingRequest): Promise<{
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

  // Get transportation area pricing statistics
  getStats: async (academicYear?: string): Promise<{
    totalRecords: number;
    activeRecords: number;
    uniqueAreas: number;
    averagePrice: number;
    academicYears: string[];
  }> => {
    const queryString = academicYear ? buildQueryString({ academicYear }) : '';
    const url = queryString ? `${API_BASE_URL}/stats?${queryString}` : `${API_BASE_URL}/stats`;
    
    const response = await apiCall<TransportationAreaPricingStatsResponse>(url);
    return response.data;
  },
};

// Fee Categories API for transportation (area-based only)
export const transportationFeeCategoriesApi = {
  // Get area-based fee categories only
  getAreaBased: async (): Promise<any[]> => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
    const queryString = buildQueryString({ isActive: true, pricingType: 'Area-based' });
    const url = `${API_BASE_URL}/api/fee-categories?${queryString}`;
    
    const response = await fetch(url, {
      credentials: "include"
    });
    const body = await response.json();
    if (!body.success) {
      throw new Error(body.error?.message || body.message);
    }
    return body.data;
  },

  // Get all fee categories
  getAll: async (filters?: { isActive?: boolean; pricingType?: string }): Promise<any[]> => {
    const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `${API_BASE_URL}/api/fee-categories?${queryString}` : `${API_BASE_URL}/api/fee-categories`;
    
    const response = await fetch(url, {
      credentials: "include"
    });
    const body = await response.json();
    if (!body.success) {
      throw new Error(body.error?.message || body.message);
    }
    return body.data;
  },
};

// Utility functions for transportation area pricing
export const transportationAreaPricingUtils = {
  // Calculate total amount for an area
  calculateAreaTotal: (pricingData: TransportationAreaPricing[]): number => {
    return pricingData.reduce((total, pricing) => total + Number(pricing.price), 0);
  },

  // Group pricing by area
  groupByArea: (pricingData: TransportationAreaPricing[]): Record<string, TransportationAreaPricing[]> => {
    return pricingData.reduce((groups, pricing) => {
      const areaName = pricing.areaName;
      if (!groups[areaName]) {
        groups[areaName] = [];
      }
      groups[areaName].push(pricing);
      return groups;
    }, {} as Record<string, TransportationAreaPricing[]>);
  },

  // Group pricing by academic year
  groupByAcademicYear: (pricingData: TransportationAreaPricing[]): Record<string, TransportationAreaPricing[]> => {
    return pricingData.reduce((groups, pricing) => {
      const year = pricing.academicYear;
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(pricing);
      return groups;
    }, {} as Record<string, TransportationAreaPricing[]>);
  },

  // Get unique area names
  getUniqueAreaNames: (pricingData: TransportationAreaPricing[]): string[] => {
    const areas = pricingData.map(item => item.areaName);
    return [...new Set(areas)].sort();
  },

  // Format currency for display
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format date for input fields
  formatDateForInput: (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0];
  },

  // Check if pricing is currently active
  isPricingActive: (pricing: TransportationAreaPricing): boolean => {
    if (!pricing.isActive) return false;
    
    const now = new Date();
    const effectiveFrom = new Date(pricing.effectiveFrom);
    const effectiveTo = new Date(pricing.effectiveTo);
    
    return now >= effectiveFrom && now <= effectiveTo;
  },

  // Get pricing status
  getPricingStatus: (pricing: TransportationAreaPricing): 'active' | 'inactive' | 'expired' => {
    if (!pricing.isActive) return 'inactive';
    
    const now = new Date();
    const effectiveFrom = new Date(pricing.effectiveFrom);
    const effectiveTo = new Date(pricing.effectiveTo);
    
    if (now < effectiveFrom) return 'inactive';
    if (now > effectiveTo) return 'expired';
    return 'active';
  },

  // Get status color for UI
  getStatusColor: (status: 'active' | 'inactive' | 'expired'): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  // Validate form data
  validateFormData: (data: CreateTransportationAreaPricingRequest): string[] => {
    const errors: string[] = [];
    
    if (!data.areaName?.trim()) {
      errors.push('Area name is required');
    }
    
    if (!data.price || data.price <= 0) {
      errors.push('Price must be greater than 0');
    }
    
    if (!data.feeCategoryId) {
      errors.push('Fee category is required');
    }
    
    if (!data.academicYear || !transportationAreaPricingUtils.isValidAcademicYear(data.academicYear)) {
      errors.push('Valid academic year is required (format: YYYY-YY)');
    }
    
    if (!data.effectiveFrom) {
      errors.push('Effective from date is required');
    }
    
    if (!data.effectiveTo) {
      errors.push('Effective to date is required');
    }
    
    if (data.effectiveFrom && data.effectiveTo && new Date(data.effectiveFrom) >= new Date(data.effectiveTo)) {
      errors.push('Effective to date must be after effective from date');
    }
    
    return errors;
  },
};

export default transportationAreaPricingApi;
