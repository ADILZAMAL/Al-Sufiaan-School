import { TeachingStaff } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export const teachingStaffApi = {
  // Create new teaching staff
  create: async (data: Omit<TeachingStaff, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeachingStaff> => {
    const response = await fetch(`${API_BASE_URL}/api/teaching-staff`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to create teaching staff');
    }
    return body.data;
  },

  // Get all teaching staff for a school
  getAll: async (schoolId: number): Promise<TeachingStaff[]> => {
    const response = await fetch(`${API_BASE_URL}/api/teaching-staff?schoolId=${schoolId}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch teaching staff');
    }
    return body.data;
  },

  // Get teaching staff by ID
  getById: async (id: number): Promise<TeachingStaff> => {
    const response = await fetch(`${API_BASE_URL}/api/teaching-staff/${id}`, {
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to fetch teaching staff');
    }
    return body.data;
  },

  // Update teaching staff
  update: async (id: number, data: Partial<TeachingStaff>): Promise<TeachingStaff> => {
    const response = await fetch(`${API_BASE_URL}/api/teaching-staff/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to update teaching staff');
    }
    return body.data;
  },

  // Mark teaching staff as left school
  markLeftSchool: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/teaching-staff/${id}/left-school`, {
      method: 'PUT',
      credentials: 'include'
    });

    const body = await response.json();
    if (!body.success) {
      throw new Error(body.message || 'Failed to mark teaching staff as left school');
    }
  }
};
