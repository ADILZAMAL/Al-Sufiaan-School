// Holiday API
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json();
  
  if (!body.success) {
    throw new Error(body.message || 'API request failed');
  }
  
  return body;
};

export interface Holiday {
  id: number;
  schoolId: number;
  startDate: string;
  endDate: string;
  name: string;
  reason?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  numberOfDays?: number;
}

export interface CreateHolidayRequest {
  startDate: string;
  endDate: string;
  name: string;
  reason?: string;
}

export interface UpdateHolidayRequest {
  startDate?: string;
  endDate?: string;
  name?: string;
  reason?: string;
}

export const holidayApi = {
  // Create a new holiday
  createHoliday: async (data: CreateHolidayRequest): Promise<Holiday> => {
    const response = await apiRequest('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get all holidays
  getHolidays: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Holiday[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const body = await apiRequest(`/holidays?${queryParams.toString()}`);
    return body.data;
  },

  // Get single holiday by ID
  getHolidayById: async (id: number): Promise<Holiday> => {
    const response = await apiRequest(`/holidays/${id}`);
    return response.data;
  },

  // Update holiday
  updateHoliday: async (id: number, data: UpdateHolidayRequest): Promise<Holiday> => {
    const response = await apiRequest(`/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete holiday
  deleteHoliday: async (id: number): Promise<void> => {
    return await apiRequest(`/holidays/${id}`, {
      method: 'DELETE',
    });
  },

  // Check if a date is a holiday
  checkIsHoliday: async (date: string): Promise<{
    isHoliday: boolean;
    holiday?: Holiday;
  }> => {
    return await apiRequest(`/holidays/check/${date}`);
  },
};

export const createHoliday = holidayApi.createHoliday;
export const getHolidays = holidayApi.getHolidays;
export const getHolidayById = holidayApi.getHolidayById;
export const updateHoliday = holidayApi.updateHoliday;
export const deleteHoliday = holidayApi.deleteHoliday;
export const checkIsHoliday = holidayApi.checkIsHoliday;
