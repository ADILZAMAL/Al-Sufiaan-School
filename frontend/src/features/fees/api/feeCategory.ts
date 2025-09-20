import { 
  FeeCategory, 
  FeeCategoryFormData, 
  FeeCategoryResponse, 
  FeeCategoriesResponse,
  FeeCategoryFilters,
  ReorderRequest
} from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

// Helper function to get auth token from cookies
const getAuthToken = (): string | null => {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
  return authCookie ? authCookie.split('=')[1] : null;
};

// Helper function for API requests
const apiRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/${url}`, {
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Fee Category API functions
export const feeCategoryApi = {
  // Get all fee categories
  getAll: async (filters?: FeeCategoryFilters): Promise<FeeCategory[]> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.isActive !== undefined) {
      queryParams.append('isActive', filters.isActive.toString());
    }
    if (filters?.feeType) {
      queryParams.append('feeType', filters.feeType);
    }
    if (filters?.pricingType) {
      queryParams.append('pricingType', filters.pricingType);
    }

    const queryString = queryParams.toString();
    const url = `/fee-categories${queryString ? `?${queryString}` : ''}`;
    
    const response: FeeCategoriesResponse = await apiRequest(url);
    return response.data;
  },

  // Get fee category by ID
  getById: async (id: number): Promise<FeeCategory> => {
    const response: FeeCategoryResponse = await apiRequest(`/fee-categories/${id}`);
    return response.data;
  },

  // Get fee categories by type
  getByType: async (type: 'One-time' | 'Annual' | 'Monthly' | 'Quarterly'): Promise<FeeCategory[]> => {
    const response: FeeCategoriesResponse = await apiRequest(`/fee-categories/type/${type}`);
    return response.data;
  },

  // Create new fee category
  create: async (data: FeeCategoryFormData): Promise<FeeCategory> => {
    const response: FeeCategoryResponse = await apiRequest('/fee-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update fee category
  update: async (id: number, data: Partial<FeeCategoryFormData>): Promise<FeeCategory> => {
    const response: FeeCategoryResponse = await apiRequest(`/fee-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete fee category (soft delete)
  delete: async (id: number): Promise<void> => {
    await apiRequest(`/fee-categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Reorder fee categories
  reorder: async (categoryOrders: ReorderRequest): Promise<void> => {
    await apiRequest('/fee-categories/reorder', {
      method: 'PUT',
      body: JSON.stringify(categoryOrders),
    });
  },

  // Toggle active status
  toggleActive: async (id: number, isActive: boolean): Promise<FeeCategory> => {
    const response: FeeCategoryResponse = await apiRequest(`/fee-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
    return response.data;
  },
};

// Export individual functions for convenience
export const {
  getAll: getAllFeeCategories,
  getById: getFeeCategoryById,
  getByType: getFeeCategoriesByType,
  create: createFeeCategory,
  update: updateFeeCategory,
  delete: deleteFeeCategory,
  reorder: reorderFeeCategories,
  toggleActive: toggleFeeCategoryActive,
} = feeCategoryApi;

export default feeCategoryApi;
