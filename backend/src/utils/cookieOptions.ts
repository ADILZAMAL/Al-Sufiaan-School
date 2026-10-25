export const AUTH_COOKIE_NAME = 'auth_token';

/** Lifetime of an auth session. Used for both the JWT expiry and the cookie maxAge. */
export const AUTH_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 1 day

/**
 * Get cookie options for authentication cookies.
 * Used when setting the cookie at login and when clearing it at logout
 * (res.clearCookie needs the same attributes to remove the cookie).
 *
 * For production (cross-site): Uses SameSite=None and Secure=true
 * For development: Uses SameSite=Lax and Secure=false (works with localhost)
 */
export const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    path: '/',
    ...(isProduction
      ? {
          sameSite: 'none' as const,
          secure: true,
        }
      : {
          sameSite: 'lax' as const,
          secure: false,
        }),
  };
};
