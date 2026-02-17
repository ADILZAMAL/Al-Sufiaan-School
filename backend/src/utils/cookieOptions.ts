/**
 * Get cookie options for authentication cookies
 * Ensures consistent cookie settings across login and logout
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

/**
 * Get cookie options for clearing/deleting cookies
 * Must match the same attributes used when setting the cookie
 */
export const getAuthCookieClearOptions = () => {
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
    expires: new Date(0),
  };
};
