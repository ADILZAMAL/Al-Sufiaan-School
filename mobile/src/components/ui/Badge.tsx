import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral' }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const palette: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
    primary: { bg: colors.primarySoft, fg: colors.primaryDark },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    info: { bg: colors.infoSoft, fg: colors.info },
  };
  return (
    <View style={[styles.badge, { backgroundColor: palette[tone].bg }]}>
      <Text style={[styles.label, { color: palette[tone].fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const useStyles = makeStyles(({ radius, spacing, typography }) => ({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: { ...typography.small },
}));
