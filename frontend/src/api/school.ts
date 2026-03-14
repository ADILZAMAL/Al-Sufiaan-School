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
  hostelFee?: number | null;
  admissionFee?: number | null;
  dayboardingFee?: number | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getAllSchools = async (): Promise<School[]> => {
  const response = await fetch(`${API_BASE_URL}/api/schools`);
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to fetch schools');
  return body.data as School[];
};

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

export interface OnboardSchoolData {
  name: string;
  email: string;
  mobile: string;
  sid: string;
  udiceCode: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  username: string;
  password: string;
}

export const verifyOnboardCredentials = async (username: string, password: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/verify-onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Invalid credentials');
  return body.data.token as string;
};

export const onboardSchool = async (token: string, data: Omit<OnboardSchoolData, 'username' | 'password'>): Promise<School> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to onboard school');
  return body.data as School;
};

export const createSuperAdmin = async (token: string, data: {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  adminPassword: string;
  schoolId: number;
}): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/create-super-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to create super admin');
};

export interface SuperAdminUser {
  id: number;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  role: string;
  createdAt: string;
}

export const getSchoolSuperAdmin = async (schoolId: number): Promise<SuperAdminUser | null> => {
  const response = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/super-admin`);
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to fetch super admin');
  return body.data as SuperAdminUser | null;
};

export const uploadSchoolLogo = async (token: string, file: File, schoolId?: number): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('photo', file);
  if (schoolId !== undefined) formData.append('schoolId', String(schoolId));
  const response = await fetch(`${API_BASE_URL}/api/photos/upload-school-logo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to upload school logo');
  return body.data as { logoUrl: string };
};

export const updateSchoolLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await fetch(`${API_BASE_URL}/api/photos/upload-school-logo`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to update school logo');
  return body.data as { logoUrl: string };
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
