import type { UserRole } from '../../auth/types';

/** A login (row in the User table). Staff-linked logins take name and mobile from the staff record. */
export interface User {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  mobileNumber: string | null;
  staffId: number | null;
  role: UserRole;
  schoolId: number;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: number;
    name: string;
    mobileNumber: string;
  } | null;
}

/** The fields the login form needs; the staff profile builds one from its loginStatus. */
export type LoginSummary = Pick<User, 'id' | 'role' | 'staffId' | 'staff' | 'firstName' | 'lastName' | 'mobileNumber' | 'email'>;

export interface CreateLoginData {
  staffId?: number;
  role: UserRole;
  password: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
}

export interface UpdateLoginData {
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
}
