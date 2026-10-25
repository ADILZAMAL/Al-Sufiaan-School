/**
 * Client-side mirror of the backend password policy (backend/src/utils/passwordValidator.ts),
 * so users see the rule before submitting. The server remains the source of truth.
 */
export const PASSWORD_RULES: { label: string; error: string; test: (password: string) => boolean }[] = [
  { label: 'At least 8 characters', error: 'Password must be at least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', error: 'Password must contain at least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', error: 'Password must contain at least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', error: 'Password must contain at least one number', test: (p) => /[0-9]/.test(p) },
  {
    label: 'One special character (@$!%*?&#^()_+=-)',
    error: 'Password must contain at least one special character (@$!%*?&#^()_+=-)',
    test: (p) => /[@$!%*?&#^()_+=-]/.test(p),
  },
];

/** Returns the first broken rule's message, or true when the password is valid (react-hook-form `validate` shape). */
export const validatePasswordStrength = (password: string): string | true =>
  PASSWORD_RULES.find((rule) => !rule.test(password ?? ''))?.error ?? true;

/** First problem with a new password + its confirmation, or null when both are fine. */
export const passwordProblem = (password: string, confirmPassword: string): string | null => {
  const strength = validatePasswordStrength(password);
  if (strength !== true) return strength;
  return password === confirmPassword ? null : 'Passwords do not match';
};
