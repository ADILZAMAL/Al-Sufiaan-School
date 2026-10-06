import React, { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { HIT_SIZE, makeStyles, useTheme } from '../../theme';
import { Icon, IconName } from './Icon';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  /** Adds a show/hide toggle for password fields. */
  secureToggle?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, hint, icon, secureToggle, secureTextEntry, style, ...inputProps }, ref) => {
    const styles = useStyles();
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);

    return (
      <View style={styles.wrap}>
        {!!label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
          {icon && <Icon name={icon} size={18} color={colors.textSubtle} />}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textSubtle}
            accessibilityLabel={label ?? inputProps.placeholder}
            {...inputProps}
            secureTextEntry={secureToggle ? hidden : secureTextEntry}
            onFocus={e => {
              setFocused(true);
              inputProps.onFocus?.(e);
            }}
            onBlur={e => {
              setFocused(false);
              inputProps.onBlur?.(e);
            }}
            style={[styles.input, style]}
          />
          {secureToggle && (
            <Pressable
              onPress={() => setHidden(h => !h)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            >
              <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} />
            </Pressable>
          )}
        </View>
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);
TextField.displayName = 'TextField';

const useStyles = makeStyles(({ colors, spacing, radius, typography }) => ({
  wrap: { gap: spacing.xs },
  label: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  field: {
    minHeight: HIT_SIZE + 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
  hint: { ...typography.caption, color: colors.textMuted },
}));
