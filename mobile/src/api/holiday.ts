import apiClient from './client';
import { Holiday } from '../types';

export type { Holiday };

export interface HolidayCheckResponse {
  isHoliday: boolean;
  holiday?: Holiday;
}

export const holidayApi = {
  // Check if a specific date is a holiday
  checkIsHoliday: async (date: string): Promise<HolidayCheckResponse> => {
    const response = await apiClient.get<{ success: boolean; data: HolidayCheckResponse }>(
      `/holidays/check/${date}`
    );
    return response.data.data;
  },

  /** Holidays overlapping a date range (Sundays are not included). */
  getHolidays: async (startDate: string, endDate: string): Promise<Holiday[]> => {
    const response = await apiClient.get<{ success: boolean; data: Holiday[] }>('/holidays', { params: { startDate, endDate } });
    return response.data.data;
  },
};
