import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ClassSelectionScreen from '../screens/ClassSelectionScreen';
import SectionSelectionScreen from '../screens/SectionSelectionScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LoadingScreen from '../screens/LoadingScreen';
import SchoolLogo from '../../assets/school-logo.svg';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  ClassSelection: undefined;
  SectionSelection: { classId: number; className: string };
  Attendance: { classId: number; sectionId: number; className: string; sectionName: string };
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
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
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
            name="ClassSelection"
            component={ClassSelectionScreen}
            options={{ title: 'Select Class' }}
          />
          <Stack.Screen
            name="SectionSelection"
            component={SectionSelectionScreen}
            options={({ route }) => ({
              title: `${route.params.className} - Select Section`,
            })}
          />
          <Stack.Screen
            name="Attendance"
            component={AttendanceScreen}
            options={({ route }) => ({
              title: `${route.params.className} - ${route.params.sectionName}`,
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
