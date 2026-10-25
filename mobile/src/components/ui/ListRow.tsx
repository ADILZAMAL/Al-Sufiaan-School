import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { HIT_SIZE, makeStyles, useTheme } from '../../theme';
import { Icon, IconName } from './Icon';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  iconBackground?: string;
  /** Custom element on the left (e.g. an Avatar); overrides `icon`. */
  left?: React.ReactNode;
  /** Custom element on the right; a chevron is shown when pressable and none is given. */
  right?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  left,
  right,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  destructive,
  style,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const content = (
    <>
      {left ??
        (icon && (
          <View style={[styles.iconWrap, { backgroundColor: iconBackground ?? (destructive ? colors.dangerSoft : colors.primarySoft) }]}>
            <Icon name={icon} size={20} color={iconColor ?? (destructive ? colors.danger : colors.primary)} />
          </View>
        ))}
      <View style={styles.text}>
        <Text style={[styles.title, destructive && { color: colors.danger }]} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (onPress && !destructive && <Icon name="chevron-forward" size={18} color={colors.textSubtle} />)}
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
};

const useStyles = makeStyles(({ colors, spacing, radius, typography }) => ({
  row: {
    minHeight: HIT_SIZE + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
}));
