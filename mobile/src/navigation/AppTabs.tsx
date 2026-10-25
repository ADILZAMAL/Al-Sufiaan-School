import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { TabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import AttendanceHomeScreen from '../screens/AttendanceHomeScreen';
import MySubjectsScreen from '../screens/MySubjectsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, [IconName, IconName]> = {
  HomeTab: ['home', 'home-outline'],
  AttendanceTab: ['checkmark-done-circle', 'checkmark-done-circle-outline'],
  AcademicsTab: ['school', 'school-outline'],
  ProfileTab: ['person-circle', 'person-circle-outline'],
};

const AppTabs: React.FC = () => {
  const { colors, typography } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
        headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerTitleStyle: { ...typography.heading, color: colors.text },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
      <Tab.Screen name="AttendanceTab" component={AttendanceHomeScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="AcademicsTab" component={MySubjectsScreen} options={{ title: 'Academics', headerTitle: 'My Subjects' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default AppTabs;
