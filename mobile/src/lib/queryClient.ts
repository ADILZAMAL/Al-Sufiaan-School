import { AppState, AppStateStatus } from 'react-native';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getStatus } from './errors';

// Pause queries while offline and refetch when the connection returns.
onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener(state => setOnline(state.isConnected !== false))
);

// Refetch stale queries when the app comes back to the foreground.
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      // Don't retry client errors (401/403/404/400); retry network/5xx twice
      // (Render cold starts can fail the first request).
      retry: (failureCount, error) => {
        const status = getStatus(error);
        if (status && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Only queries marked `meta: { persist: true }` are written to disk — stable
 * reference data (session, classes, assignments, rosters), so the app opens
 * instantly and still shows lists when offline.
 */
export const persistOptions = {
  persister: createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'rq-cache-v1',
    throttleTime: 1000,
  }),
  maxAge: 24 * 60 * 60 * 1000,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string }; meta?: Record<string, unknown> }) =>
      query.state.status === 'success' && query.meta?.persist === true,
  },
};
