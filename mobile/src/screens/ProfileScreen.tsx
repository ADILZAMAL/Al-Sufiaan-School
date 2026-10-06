import React from 'react';
import { Alert, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useAuth, useCurrentUser } from '../context/AuthContext';
import { useRootNavigation } from '../navigation/types';
import { Card, ListRow, Screen, SectionHeader } from '../components/ui';
import { makeStyles } from '../theme';

const ProfileScreen: React.FC = () => {
  const styles = useStyles();
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigation = useRootNavigation();

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need your mobile number and password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);

  const version = Constants.expoConfig?.version ?? '—';
  const updateLabel = Updates.updateId ? ` · update ${Updates.updateId.slice(0, 7)}` : '';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.staffName ?? 'T').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.staffName ?? 'Teacher'}</Text>
        <Text style={styles.role}>Teacher</Text>
      </View>

      <SectionHeader title="Account" />
      <Card padded={false} style={styles.group}>
        <ListRow icon="wallet-outline" title="My payslips" subtitle="Salary slips & payments" onPress={() => navigation.navigate('PayslipList')} />
        <View style={styles.divider} />
        <ListRow icon="key-outline" title="Change password" onPress={() => navigation.navigate('ChangePassword')} />
      </Card>

      <Card padded={false} style={styles.group}>
        <ListRow icon="log-out-outline" title="Log out" destructive onPress={confirmLogout} />
      </Card>

      <Text style={styles.version}>
        Version {version}
        {updateLabel}
      </Text>
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  header: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: colors.primaryDark },
  name: { ...typography.title, color: colors.text, marginTop: spacing.md },
  role: { ...typography.caption, color: colors.textMuted },
  group: { overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg + 38 + spacing.md },
  version: { ...typography.small, color: colors.textSubtle, textAlign: 'center' },
}));

export default ProfileScreen;
