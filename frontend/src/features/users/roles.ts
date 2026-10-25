import type { UserRole } from '../auth/types';
import type { LoginSummary } from './types';

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  CASHIER: { label: 'Cashier', color: 'bg-emerald-100 text-emerald-700' },
  TEACHER: { label: 'Teacher (mobile app)', color: 'bg-amber-100 text-amber-700' },
};

/** Web roles; TEACHER logins sign in to the mobile app and always belong to a staff member. */
export const OFFICE_ROLES: UserRole[] = ['CASHIER', 'ADMIN', 'SUPER_ADMIN'];

/** Mirrors backend utils/loginAccounts assertCanManage: Admins manage only Teacher logins. */
export const canManageRole = (actorRole: UserRole | null, targetRole: UserRole) =>
  actorRole === 'SUPER_ADMIN' || (actorRole === 'ADMIN' && targetRole === 'TEACHER');

export const loginName = (login: Pick<LoginSummary, 'staff' | 'firstName' | 'lastName'>) =>
  login.staff?.name || [login.firstName, login.lastName].filter(Boolean).join(' ') || '—';
