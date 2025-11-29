export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
  schoolId: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  School?: {
    id: number;
    name: string;
    sid: string;
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
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}
