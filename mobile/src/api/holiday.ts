import apiClient from './client';

export interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  schoolId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

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

  // Get all holidays (optional, for future use)
  getHolidays: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Holiday[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/holidays${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<{ success: boolean; data: Holiday[] }>(url);
    return response.data.data;
  },
};
