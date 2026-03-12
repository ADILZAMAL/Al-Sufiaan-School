import { Staff, StaffType } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export const staffApi = {
  create: async (data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> => {
    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Failed to create staff');
    return body.data;
  },

  getAll: async (active?: boolean, staffType?: StaffType): Promise<Staff[]> => {
    const params = new URLSearchParams();
    if (active !== undefined) params.append('active', String(active));
    if (staffType) params.append('staffType', staffType);
    let url = `${API_BASE_URL}/api/staff?${params.toString()}`;
    const response = await fetch(url, { credentials: 'include' });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Failed to fetch staff');
    return body.data;
  },

  getById: async (id: number): Promise<Staff> => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, { credentials: 'include' });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Failed to fetch staff');
    return body.data;
  },

  update: async (id: number, data: Partial<Staff>): Promise<Staff> => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Failed to update staff');
    return body.data;
  },

  markLeftSchool: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}/left-school`, {
      method: 'PUT',
      credentials: 'include'
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Failed to mark staff as left school');
  },

  enableLogin: async (staffId: number, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${staffId}/enable-login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.error?.message || body.message || 'Failed to enable staff login');
  },

  disableLogin: async (staffId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${staffId}/disable-login`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.error?.message || body.message || 'Failed to disable staff login');
  },

  uploadPhoto: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('photo', file);
    const response = await fetch(`${API_BASE_URL}/api/photos/upload-staff-photo`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.message || 'Failed to upload photo');
    return body.data.photoUrl;
  },

  resetPassword: async (staffId: number, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${staffId}/reset-password`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    const body = await response.json();
    if (!body.success) throw new Error(body.error?.message || body.message || 'Failed to reset password');
  },
};
