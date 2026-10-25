/**
 * Client-side mirror of the backend password policy (backend/src/utils/passwordValidator.ts),
 * so users see the rule before submitting. The server remains the source of truth.
 * Returns an error message, or true when the password is valid (react-hook-form `validate` shape).
 */
export const validatePasswordStrength = (password: string): string | true => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[@$!%*?&#^()_+=-]/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&#^()_+=-)';
  }
  return true;
};
