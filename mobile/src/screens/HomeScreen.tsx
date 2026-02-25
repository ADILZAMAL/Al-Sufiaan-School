import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout, user } = useAuth();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>Al Sufiaan School</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Welcome back, {user?.staffName ?? 'Teacher'}!</Text>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ClassSelection', { mode: 'attendance' })}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>📋</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Take Attendance</Text>
              <Text style={styles.cardSubtitle}>Mark today's attendance</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ClassSelection', { mode: 'students' })}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>👤</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Student Profiles</Text>
              <Text style={styles.cardSubtitle}>View & update student information</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>🔑</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardSubtitle}>Update your login password</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PayslipList')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>💰</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>My Payslips</Text>
              <Text style={styles.cardSubtitle}>View salary slips & payment history</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  schoolName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 13,
    color: '#bfdbfe',
    marginTop: 4,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 28,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardArrow: {
    fontSize: 22,
    color: '#3b82f6',
    marginLeft: 8,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  logoutText: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '500',
  },
});

export default HomeScreen;
