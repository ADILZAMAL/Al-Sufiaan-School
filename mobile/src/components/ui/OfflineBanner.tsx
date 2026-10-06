import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useTheme } from '../../theme';
import { useOnline } from '../../hooks/useOnline';
import { Icon } from './Icon';

/** Thin banner at the bottom of the screen while the device is offline. */
export const OfflineBanner: React.FC = () => {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();

  if (online) return null;
  return (
    <View
      style={[styles.banner, { paddingBottom: insets.bottom + 6 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Icon name="cloud-offline-outline" size={16} color={colors.onPrimary} />
      <Text style={styles.text}>You're offline — showing saved data</Text>
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: 6,
    backgroundColor: colors.textSecondary,
  },
  text: { ...typography.small, color: colors.onPrimary },
}));
