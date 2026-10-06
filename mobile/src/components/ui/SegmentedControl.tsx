import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles } from '../../theme';
import { haptics } from '../../lib/feedback';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!selected) {
                haptics.tap();
                onChange(option.value);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing, typography }) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  selected: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { ...typography.caption, fontWeight: '600', color: colors.textMuted },
  labelSelected: { color: colors.text },
}));
