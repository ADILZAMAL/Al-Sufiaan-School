import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authApi } from '../api/auth';
import { Button, Card, Icon, Screen, TextField } from '../components/ui';
import { makeStyles, useTheme } from '../theme';
import { getErrorMessage } from '../lib/errors';
import { toast } from '../lib/feedback';

// Mirrors backend/src/utils/passwordValidator.ts
const PASSWORD_CHECKS: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: p => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: p => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: p => /[0-9]/.test(p) },
  { label: 'One special character (@$!%*?&#)', test: p => /[@$!%*?&#^()_+=\-]/.test(p) },
];

const ChangePasswordScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecksPassed = PASSWORD_CHECKS.every(c => c.test(newPassword));
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmit = currentPassword.length > 0 && allChecksPassed && confirmPassword === newPassword && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed');
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
      <Screen>
        <Card style={styles.card}>
          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureToggle
            autoCapitalize="none"
            textContentType="password"
            returnKeyType="next"
            onSubmitEditing={() => newRef.current?.focus()}
          />
          <TextField
            ref={newRef}
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureToggle
            autoCapitalize="none"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <View style={styles.checks} accessibilityLabel="Password requirements">
            {PASSWORD_CHECKS.map(check => {
              const passed = check.test(newPassword);
              return (
                <View key={check.label} style={styles.checkRow} accessible accessibilityLabel={`${check.label}: ${passed ? 'met' : 'not met'}`}>
                  <Icon
                    name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passed ? colors.success : colors.textSubtle}
                  />
                  <Text style={[styles.checkLabel, passed && { color: colors.success }]}>{check.label}</Text>
                </View>
              );
            })}
          </View>

          <TextField
            ref={confirmRef}
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureToggle
            autoCapitalize="none"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            error={mismatch ? 'Passwords do not match' : null}
          />

          {!!error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          <Button title="Change password" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  flex: { flex: 1 },
  card: { gap: spacing.lg },
  checks: { gap: spacing.xs, marginTop: -spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkLabel: { ...typography.caption, color: colors.textMuted },
  error: {
    ...typography.caption,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
}));

export default ChangePasswordScreen;
