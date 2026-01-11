const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export interface School {
  id: number;
  name: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  mobile: string;
  udiceCode: string;
  active: boolean;
  email: string;
  sid: string;
  paymentModes: string[];
  createdAt: string;
  updatedAt: string;
}

export const getSchoolById = async (id: number): Promise<School> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/${id}`, {
    credentials: 'include',
  });

  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message || 'Failed to fetch school');
  }

  return body.data as School;
};

export const getCurrentSchool = async (): Promise<School> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/current`, {
    credentials: 'include',
  });

  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message || 'Failed to fetch current school');
  }

  return body.data as School;
};

export const updateSchool = async (id: number, schoolData: Partial<Omit<School, 'id' | 'createdAt' | 'updatedAt'>>): Promise<School> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(schoolData),
  });

  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message || 'Failed to update school');
  }

  return body.data as School;
};
