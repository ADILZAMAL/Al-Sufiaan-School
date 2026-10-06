import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Button, TextField } from '../components/ui';
import { makeStyles } from '../theme';
import { getErrorMessage, getStatus } from '../lib/errors';
import SchoolLogo from '../../assets/school-logo.svg';

const LoginScreen: React.FC = () => {
  const styles = useStyles();
  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mobileError = mobileNumber.length > 0 && !/^\d{10}$/.test(mobileNumber) ? 'Enter a 10-digit mobile number' : null;
  const canSubmit = /^\d{10}$/.test(mobileNumber) && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await login(mobileNumber, password);
      // RootNavigator switches to the app once the user is set
    } catch (err) {
      const status = getStatus(err);
      setError(status === 400 || status === 401 ? 'Incorrect mobile number or password.' : getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <SchoolLogo width={112} height={112} />
            <Text style={styles.title}>Al-Sufiaan School</Text>
            <Text style={styles.subtitle}>Teacher App</Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Mobile number"
              icon="call-outline"
              placeholder="10-digit mobile number"
              value={mobileNumber}
              onChangeText={t => setMobileNumber(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
              error={mobileError}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureToggle
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />

            {!!error && (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            )}

            <Button title="Sign in" onPress={handleLogin} loading={loading} disabled={!canSubmit} />
            <Text style={styles.help}>Forgot your password? Ask the school office to reset it.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { ...typography.display, color: colors.text, marginTop: spacing.lg },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  form: { gap: spacing.lg },
  error: {
    ...typography.caption,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  help: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
}));

export default LoginScreen;
