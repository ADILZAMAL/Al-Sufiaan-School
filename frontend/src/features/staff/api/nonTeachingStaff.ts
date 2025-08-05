import { NonTeachingStaff } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export const nonTeachingStaffApi = {
  // Create new non-teaching staff
  create: async (data: Omit<NonTeachingStaff, 'id' | 'createdAt' | 'updatedAt'>): Promise<NonTeachingStaff> => {
    const response = await fetch(`${API_BASE_URL}/api/non-teaching-staff`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to create non-teaching staff');
    }
    return body.data;
  },

  // Get all non-teaching staff for a school
  getAll: async (schoolId: number): Promise<NonTeachingStaff[]> => {
    const response = await fetch(`${API_BASE_URL}/api/non-teaching-staff?schoolId=${schoolId}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch non-teaching staff');
    }
    return body.data;
  },

  // Get non-teaching staff by ID
  getById: async (id: number): Promise<NonTeachingStaff> => {
    const response = await fetch(`${API_BASE_URL}/api/non-teaching-staff/${id}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch non-teaching staff');
    }
    return body.data;
  },

  // Update non-teaching staff
  update: async (id: number, data: Partial<NonTeachingStaff>): Promise<NonTeachingStaff> => {
    const response = await fetch(`${API_BASE_URL}/api/non-teaching-staff/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to update non-teaching staff');
    }
    return body.data;
  },

  // Mark non-teaching staff as left school
  markLeftSchool: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/non-teaching-staff/${id}/left-school`, {
      method: 'PUT',
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to mark non-teaching staff as left school');
    }
  }
};
