import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClassSelectionScreen from '../screens/ClassSelectionScreen';
import SectionSelectionScreen from '../screens/SectionSelectionScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import StudentListScreen from '../screens/StudentListScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';
import SchoolLogo from '../../assets/school-logo.svg';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Home: undefined;
  ClassSelection: { mode: 'attendance' | 'students' };
  SectionSelection: { classId: number; className: string; mode: 'attendance' | 'students' };
  Attendance: { classId: number; sectionId: number; className: string; sectionName: string };
  StudentList: { classId: number; sectionId: number; className: string; sectionName: string };
  StudentProfile: { studentId: number; studentName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const HeaderLogo = () => (
  <View style={headerStyles.container}>
    <SchoolLogo width={32} height={32} />
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitle: () => <HeaderLogo />,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ClassSelection"
            component={ClassSelectionScreen}
            options={({ route }) => ({
              title: route.params.mode === 'students' ? 'Student Profiles' : 'Take Attendance',
            })}
          />
          <Stack.Screen
            name="SectionSelection"
            component={SectionSelectionScreen}
            options={({ route }) => ({
              title: `${route.params.className} — Select Section`,
            })}
          />
          <Stack.Screen
            name="Attendance"
            component={AttendanceScreen}
            options={({ route }) => ({
              title: `${route.params.className} - ${route.params.sectionName}`,
            })}
          />
          <Stack.Screen
            name="StudentList"
            component={StudentListScreen}
            options={({ route }) => ({
              title: `${route.params.className} — ${route.params.sectionName}`,
            })}
          />
          <Stack.Screen
            name="StudentProfile"
            component={StudentProfileScreen}
            options={({ route }) => ({
              title: route.params.studentName,
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
