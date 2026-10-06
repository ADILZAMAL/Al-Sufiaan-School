import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Pull-to-refresh state that only shows the spinner for user-initiated
 * refreshes (not background refetches).
 */
export const usePullToRefresh = (refetch: () => Promise<unknown>) => {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  return { refreshing, onRefresh };
};

/** Refetch when the screen regains focus (e.g. after editing on a pushed screen). */
export const useRefetchOnFocus = (refetch: () => unknown) => {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
};
