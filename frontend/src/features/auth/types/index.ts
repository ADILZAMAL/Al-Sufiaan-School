export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | 'TEACHER';

export type SignInFormData = {
  mobileNumber: string;
  password: string;
};

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
