import apiClient from './client';
import { Class } from '../types';

export const classesApi = {
  /** Classes in the active session with their sections, in class order. */
  getClasses: async (schoolId: number): Promise<Class[]> => {
    const response = await apiClient.get<{ success: boolean; data: Class[] }>(
      `/classes?schoolId=${schoolId}`
    );
    return response.data.data;
  },
};
