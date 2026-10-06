import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { tokenStorage } from '../lib/tokenStorage';
import { authEvents } from '../lib/authEvents';

// Get base URL from environment or default
// For Android Emulator: use 10.0.2.2 instead of localhost
// For iOS Simulator: localhost works
// For physical device: use your computer's local IP (e.g., http://192.168.1.xxx:7000/api)
const getBaseURL = () => {
  // Check for custom API URL in environment
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Development mode - check if we're in dev (Expo/React Native sets this)
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:7000/api';
    }
    // iOS simulator and web can use localhost
    return 'http://localhost:7000/api';
  }

  // Production
  return 'https://al-sufiaan-school-backend.onrender.com/api';
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  // Generous timeout: the Render backend can take ~30s to cold start
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 anywhere (expired token, login disabled by admin) ends the session.
// The login request itself is excluded: its 400/401 is a wrong password.
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      authEvents.emitUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
