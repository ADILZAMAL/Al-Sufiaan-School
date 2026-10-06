import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'file-tray-outline', title, message, actionLabel, onAction }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={32} color={colors.textSubtle} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />}
    </View>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, retrying }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="cloud-offline-outline" size={32} color={colors.danger} />
      </View>
      <Text style={styles.title}>Couldn't load this</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button title="Try again" icon="refresh" onPress={onRetry} loading={retrying} style={styles.action} />}
    </View>
  );
};

export const LoadingState: React.FC<{ label?: string }> = ({ label }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Loading'}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!label && <Text style={[styles.message, { marginTop: 12 }]}>{label}</Text>}
    </View>
  );
};

/** Placeholder rows while a list loads — feels faster than a spinner. */
export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.skeletonWrap} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Animated.View key={i} style={[styles.skeletonRow, { opacity }]}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '35%', height: 10 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, radius, typography }) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading, color: colors.text, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, maxWidth: 320 },
  action: { marginTop: spacing.lg, minWidth: 160 },
  skeletonWrap: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flex: 1 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
  skeletonLines: { flex: 1, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: colors.border },
}));
