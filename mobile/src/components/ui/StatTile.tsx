import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';

interface StatTileProps {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, tone = 'default' }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    success: colors.success,
    danger: colors.danger,
    warning: colors.warning,
    primary: colors.primary,
  }[tone];

  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const useStyles = makeStyles(({ colors, radius, spacing, typography }) => ({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  value: { ...typography.title },
  label: { ...typography.small, color: colors.textMuted, marginTop: 2 },
}));
