import apiClient from './client';
import { Class } from '../types';

export const classesApi = {
  getClasses: async (schoolId: number): Promise<Class[]> => {
    const response = await apiClient.get<{ success: boolean; data: Class[] }>(
      `/classes?schoolId=${schoolId}`
    );
    return response.data.data;
  },
};
