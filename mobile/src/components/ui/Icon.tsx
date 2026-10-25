import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/** Decorative icon — hidden from screen readers; label the parent instead. */
export const Icon: React.FC<IconProps> = ({ name, size = 22, color }) => {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? colors.textMuted}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
};
