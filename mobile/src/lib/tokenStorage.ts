import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

// In-memory copy so the axios interceptor doesn't hit the keychain per request.
let cached: string | null | undefined;

/**
 * JWT storage in the OS keychain/keystore. Older builds kept the token in
 * AsyncStorage; it is moved over on first read so upgrading doesn't log out.
 */
export const tokenStorage = {
  async get(): Promise<string | null> {
    if (cached !== undefined) return cached;

    let token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      const legacy = await AsyncStorage.getItem(TOKEN_KEY);
      if (legacy && legacy !== 'cookie_based_auth') {
        await SecureStore.setItemAsync(TOKEN_KEY, legacy);
        token = legacy;
      }
      if (legacy !== null) await AsyncStorage.removeItem(TOKEN_KEY);
    }

    cached = token ?? null;
    return cached;
  },

  async set(token: string): Promise<void> {
    cached = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async clear(): Promise<void> {
    cached = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};
