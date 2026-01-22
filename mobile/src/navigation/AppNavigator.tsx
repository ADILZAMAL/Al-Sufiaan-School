import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ClassSelectionScreen from '../screens/ClassSelectionScreen';
import SectionSelectionScreen from '../screens/SectionSelectionScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LoadingScreen from '../screens/LoadingScreen';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  ClassSelection: undefined;
  SectionSelection: { classId: number; className: string };
  Attendance: { classId: number; sectionId: number; className: string; sectionName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

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
