import axios from 'axios';

/** A user-facing message for any error thrown by the API layer. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. Please try again.';
    }
    if (!error.response) {
      return "Can't reach the server. Check your internet connection.";
    }
    const data = error.response.data as { message?: string; error?: { message?: string } } | undefined;
    return data?.message || data?.error?.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const isNetworkError = (error: unknown) => axios.isAxiosError(error) && !error.response;

export const getStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;
