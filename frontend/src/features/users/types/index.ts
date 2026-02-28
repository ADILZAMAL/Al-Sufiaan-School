export interface User {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  mobileNumber?: string | null;
  staffId?: number | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | 'TEACHER';
  schoolId: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  School?: {
    id: number;
    name: string;
    sid: string;
  };
  staff?: {
    id: number;
    name: string;
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
  schoolId: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}
