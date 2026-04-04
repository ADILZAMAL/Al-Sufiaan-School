import {
  FeeHead,
  FeeHeadResponse,
  FeeHeadClassPricingItem,
  FeeHeadClassPricingResponse,
  FeeHeadBulkUpsertResponse,
  CreateFeeHeadRequest,
  UpdateFeeHeadRequest,
  BulkUpsertClassPricingRequest,
} from '../types';

const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || '';
const API_BASE_URL = `${BASE_URL}/api/fee-heads`;

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

export const feeHeadApi = {
  getAll: async (): Promise<FeeHead[]> => {
    const response = await apiCall<FeeHeadResponse>(API_BASE_URL);
    return response.data as FeeHead[];
  },

  create: async (data: CreateFeeHeadRequest): Promise<FeeHead> => {
    const response = await apiCall<FeeHeadResponse>(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as FeeHead;
  },

  update: async (id: number, data: UpdateFeeHeadRequest): Promise<FeeHead> => {
    const response = await apiCall<FeeHeadResponse>(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data as FeeHead;
  },

  delete: async (id: number): Promise<void> => {
    await apiCall(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
  },

  getClassPricing: async (id: number): Promise<FeeHeadClassPricingItem[]> => {
    const response = await apiCall<FeeHeadClassPricingResponse>(`${API_BASE_URL}/${id}/class-pricing`);
    return response.data;
  },

  bulkUpsertClassPricing: async (
    id: number,
    data: BulkUpsertClassPricingRequest
  ): Promise<Array<{ action: 'created' | 'updated'; classId: number }>> => {
    const response = await apiCall<FeeHeadBulkUpsertResponse>(
      `${API_BASE_URL}/${id}/class-pricing/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },
};

export default feeHeadApi;
