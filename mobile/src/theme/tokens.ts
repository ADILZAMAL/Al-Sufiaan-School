import { TextStyle } from 'react-native';

export const lightColors = {
  primary: '#3b82f6',
  primaryDark: '#1d4ed8',
  primarySoft: '#eff6ff',
  onPrimary: '#ffffff',
  onPrimaryMuted: '#bfdbfe',
  /** Home header: brand blue with white text in both themes. */
  hero: '#3b82f6',
  onHero: '#ffffff',
  onHeroMuted: '#dbeafe',

  background: '#f3f4f6',
  surface: '#ffffff',
  surfaceMuted: '#f9fafb',
  border: '#e5e7eb',
  divider: '#f3f4f6',
  overlay: 'rgba(17, 24, 39, 0.4)',

  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',

  success: '#16a34a',
  successSoft: '#dcfce7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  info: '#0284c7',
  infoSoft: '#e0f2fe',

  present: '#16a34a',
  presentSoft: '#dcfce7',
  absent: '#dc2626',
  absentSoft: '#fee2e2',
  holiday: '#9ca3af',
  holidaySoft: '#f3f4f6',
};

export type ThemeColors = typeof lightColors;

// Dark palette — enabled in Phase 5 (app.json userInterfaceStyle: "automatic").
export const darkColors: ThemeColors = {
  primary: '#60a5fa',
  primaryDark: '#3b82f6',
  primarySoft: '#172554',
  onPrimary: '#0b1220',
  onPrimaryMuted: '#1e3a8a',
  hero: '#1d4ed8',
  onHero: '#ffffff',
  onHeroMuted: '#bfdbfe',

  background: '#0b1220',
  surface: '#111827',
  surfaceMuted: '#1f2937',
  border: '#374151',
  divider: '#1f2937',
  overlay: 'rgba(0, 0, 0, 0.6)',

  text: '#f9fafb',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  textSubtle: '#6b7280',

  success: '#4ade80',
  successSoft: '#052e16',
  danger: '#f87171',
  dangerSoft: '#450a0a',
  warning: '#fbbf24',
  warningSoft: '#451a03',
  info: '#38bdf8',
  infoSoft: '#082f49',

  present: '#4ade80',
  presentSoft: '#052e16',
  absent: '#f87171',
  absentSoft: '#450a0a',
  holiday: '#6b7280',
  holidaySoft: '#1f2937',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

type TypeScale = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'small';

export const typography: Record<TypeScale, TextStyle> = {
  display: { fontSize: 26, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
  small: { fontSize: 12, fontWeight: '500' },
};

/** Minimum touch target (iOS HIG 44pt / Material 48dp). */
export const HIT_SIZE = 44;
