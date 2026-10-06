import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { LoadingState } from '../components/ui';
import { RootStackParamList } from './types';
import AppTabs from './AppTabs';
import LoginScreen from '../screens/LoginScreen';
import SectionPickerScreen from '../screens/SectionPickerScreen';
import TakeAttendanceScreen from '../screens/TakeAttendanceScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import StudentAttendanceScreen from '../screens/StudentAttendanceScreen';
import BoardingAttendanceScreen from '../screens/BoardingAttendanceScreen';
import StudentListScreen from '../screens/StudentListScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PayslipListScreen from '../screens/PayslipListScreen';
import PayslipDetailScreen from '../screens/PayslipDetailScreen';
import SubjectHomeScreen from '../screens/SubjectHomeScreen';
import ClassTestFormScreen from '../screens/ClassTestFormScreen';
import MarksEntryScreen from '../screens/MarksEntryScreen';
import ExamResultsScreen from '../screens/ExamResultsScreen';
import ReportCardPickerScreen from '../screens/ReportCardPickerScreen';
import SectionReportScreen from '../screens/SectionReportScreen';
import StudentReportCardScreen from '../screens/StudentReportCardScreen';
import StudentPerformanceScreen from '../screens/StudentPerformanceScreen';
import HolidayCalendarScreen from '../screens/HolidayCalendarScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { colors, typography } = useTheme();

  if (loading) return <LoadingState />;

  const screenOptions: StackNavigationOptions = {
    headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTintColor: colors.primary,
    headerTitleStyle: { ...typography.heading, color: colors.text },
    headerBackTitleVisible: false,
    cardStyle: { backgroundColor: colors.background },
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />

          <Stack.Screen
            name="SectionPicker"
            component={SectionPickerScreen}
            options={({ route }) => ({
              title: { attendance: 'Class Attendance', students: 'Students', history: 'Attendance History' }[route.params.mode],
            })}
          />
          <Stack.Screen
            name="Attendance"
            component={TakeAttendanceScreen}
            options={({ route }) => ({ title: `${route.params.className} – ${route.params.sectionName}` })}
          />
          <Stack.Screen
            name="AttendanceHistory"
            component={AttendanceHistoryScreen}
            options={({ route }) => ({ title: `History · ${route.params.className} – ${route.params.sectionName}` })}
          />
          <Stack.Screen
            name="StudentAttendance"
            component={StudentAttendanceScreen}
            options={({ route }) => ({ title: route.params.studentName })}
          />
          <Stack.Screen
            name="BoardingAttendance"
            component={BoardingAttendanceScreen}
            options={({ route }) => ({
              title: route.params.boardingType === 'HOSTEL' ? 'Hostel Attendance' : 'Dayboarding Attendance',
            })}
          />
          <Stack.Screen
            name="StudentList"
            component={StudentListScreen}
            options={({ route }) => ({ title: `${route.params.className} – ${route.params.sectionName}` })}
          />
          <Stack.Screen
            name="StudentProfile"
            component={StudentProfileScreen}
            options={({ route }) => ({ title: route.params.studentName })}
          />

          <Stack.Screen
            name="SubjectHome"
            component={SubjectHomeScreen}
            options={({ route }) => ({ title: `${route.params.subjectName} · ${route.params.className}–${route.params.sectionName}` })}
          />
          <Stack.Screen name="ClassTestForm" component={ClassTestFormScreen} options={{ title: 'Class test' }} />
          <Stack.Screen
            name="MarksEntry"
            component={MarksEntryScreen}
            options={({ route }) => ({ title: route.params.examName })}
          />
          <Stack.Screen name="ExamResults" component={ExamResultsScreen} options={{ title: 'Results' }} />
          <Stack.Screen name="ReportCardPicker" component={ReportCardPickerScreen} options={{ title: 'Report Cards' }} />
          <Stack.Screen name="SectionReport" component={SectionReportScreen} options={{ title: 'Report Cards' }} />
          <Stack.Screen name="StudentReportCard" component={StudentReportCardScreen} options={{ title: 'Report Card' }} />
          <Stack.Screen
            name="StudentPerformance"
            component={StudentPerformanceScreen}
            options={({ route }) => ({ title: route.params.studentName })}
          />

          <Stack.Screen name="HolidayCalendar" component={HolidayCalendarScreen} options={{ title: 'Holidays' }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
          <Stack.Screen name="PayslipList" component={PayslipListScreen} options={{ title: 'My Payslips' }} />
          <Stack.Screen
            name="PayslipDetail"
            component={PayslipDetailScreen}
            options={({ route }) => ({ title: `${route.params.monthName} ${route.params.year}` })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
