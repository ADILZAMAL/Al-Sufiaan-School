import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme';
import { ErrorBoundary, OfflineBanner } from './src/components/ui';
import { queryClient, persistOptions } from './src/lib/queryClient';
import { purgeOldDrafts } from './src/lib/drafts';

const ThemedNavigation: React.FC = () => {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    purgeOldDrafts();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <AuthProvider>
              <ThemedNavigation />
            </AuthProvider>
          </PersistQueryClientProvider>
        </ErrorBoundary>
        <OfflineBanner />
        <Toast topOffset={56} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
