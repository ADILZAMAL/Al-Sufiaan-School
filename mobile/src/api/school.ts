import apiClient from './client';

export interface SchoolInfo {
  id: number;
  name: string;
  street?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  mobile?: string | null;
  udiceCode?: string | null;
  logoUrl?: string | null;
}

export const schoolApi = {
  getCurrent: async (): Promise<SchoolInfo> => {
    const response = await apiClient.get<{ success: boolean; data: SchoolInfo }>('/schools/current');
    return response.data.data;
  },

  /** Logo as a data URI — embedded in PDFs, where remote images are unreliable. */
  getLogoDataUri: async (): Promise<string | null> => {
    const response = await apiClient.get<{ success: boolean; data: { base64: string } | null }>('/schools/logo-base64');
    return response.data.data?.base64 ?? null;
  },
};
