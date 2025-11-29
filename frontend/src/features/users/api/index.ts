import { User, CreateUserData, UpdateUserData, UpdateProfileData } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

// Get all users (SUPER_ADMIN only)
export const getAllUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    credentials: 'include'
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Get user by ID
export const getUserById = async (id: number): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    credentials: 'include'
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    credentials: 'include'
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Create new user (SUPER_ADMIN only)
export const createUser = async (userData: CreateUserData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Update user (SUPER_ADMIN or self)
export const updateUser = async (id: number, userData: UpdateUserData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Update own profile
export const updateProfile = async (profileData: UpdateProfileData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData)
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
};

// Delete user (SUPER_ADMIN only)
export const deleteUser = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
};

// Change password
export const changePassword = async (formData: any): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message);
  }
};
