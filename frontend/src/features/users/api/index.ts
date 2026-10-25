import { User, CreateLoginData, UpdateLoginData } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

// Every login (staff-linked or not) is managed through /api/users; the backend decides who may change what.
const send = async <T>(path: string, method: string, data?: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}/api/users${path}`, {
    method,
    credentials: 'include',
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Get every login (SUPER_ADMIN only)
export const getAllUsers = () => send<User[]>('', 'GET');

export const createLogin = (data: CreateLoginData) => send<User>('', 'POST', data);

export const updateLogin = (id: number, data: UpdateLoginData) => send<User>(`/${id}`, 'PUT', data);

export const resetLoginPassword = (id: number, password: string) => send<null>(`/${id}/password`, 'PUT', { password });

// Soft delete: past records stay linked; a staff login can be enabled again from the staff profile
export const disableLogin = (id: number) => send<null>(`/${id}`, 'DELETE');
