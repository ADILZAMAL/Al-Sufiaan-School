import apiClient from './client';
import { Section } from '../types';

export const sectionsApi = {
  getSectionsByClass: async (classId: number): Promise<Section[]> => {
    const response = await apiClient.get<{ success: boolean; data: Section[] }>(
      `/sections?classId=${classId}`
    );
    return response.data.data;
  },
};
