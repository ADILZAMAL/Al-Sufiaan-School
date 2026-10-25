import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, onPress, accessibilityLabel, style, padded = true }) => {
  const styles = useStyles();
  if (!onPress) {
    return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, padded && styles.padded, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
};

const useStyles = makeStyles(({ colors, radius, spacing, shadow }) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
}));
