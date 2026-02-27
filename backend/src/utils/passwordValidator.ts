/**
 * Validates password strength.
 * Requirements:
 *  - Minimum 8 characters
 *  - At least 1 uppercase letter (A-Z)
 *  - At least 1 lowercase letter (a-z)
 *  - At least 1 number (0-9)
 *  - At least 1 special character (@$!%*?&#^()_+=-)
 *
 * Returns an error message string if invalid, or null if valid.
 */
export const validatePasswordStrength = (password: string): string | null => {
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }
    if (!/[@$!%*?&#^()_+=\-]/.test(password)) {
        return 'Password must contain at least one special character (@$!%*?&#^()_+=-)';
    }
    return null;
};
