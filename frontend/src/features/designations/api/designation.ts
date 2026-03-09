import { Designation, CreateDesignationRequest, UpdateDesignationRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || '';

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'API request failed');
  return body;
};

export const designationApi = {
  getAll: async (params?: { active?: boolean }): Promise<Designation[]> => {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.append('active', String(params.active));
    const qs = query.toString();
    const body = await apiRequest(`/designations${qs ? `?${qs}` : ''}`);
    return body.data;
  },

  create: async (data: CreateDesignationRequest): Promise<Designation> => {
    const body = await apiRequest('/designations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return body.data;
  },

  update: async (id: number, data: UpdateDesignationRequest): Promise<Designation> => {
    const body = await apiRequest(`/designations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return body.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest(`/designations/${id}`, { method: 'DELETE' });
  },
};
