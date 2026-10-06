import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, spacing, typography, ThemeColors } from './tokens';

export * from './tokens';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

const buildTheme = (scheme: 'light' | 'dark'): Theme => ({
  scheme,
  colors: scheme === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  typography,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: scheme === 'dark' ? 0 : 0.06,
    shadowRadius: 4,
    elevation: scheme === 'dark' ? 0 : 2,
  },
});

const ThemeContext = createContext<Theme>(buildTheme('light'));

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

/**
 * Theme-aware StyleSheet. Declare once at module level, call inside the
 * component:
 *
 *   const useStyles = makeStyles(({ colors, spacing }) => ({ root: { ... } }));
 *   const styles = useStyles();
 */
export const makeStyles = <T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) => {
  return (): T => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
};
