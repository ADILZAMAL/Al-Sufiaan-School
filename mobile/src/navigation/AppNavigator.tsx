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
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PayslipListScreen from '../screens/PayslipListScreen';
import PayslipDetailScreen from '../screens/PayslipDetailScreen';
import LoadingScreen from '../screens/LoadingScreen';
import MarksClassSelectionScreen from '../screens/MarksClassSelectionScreen';
import MarksSectionSelectionScreen from '../screens/MarksSectionSelectionScreen';
import MarksSubjectSelectionScreen from '../screens/MarksSubjectSelectionScreen';
import MarksChapterSelectionScreen from '../screens/MarksChapterSelectionScreen';
import MarksExamSelectionScreen from '../screens/MarksExamSelectionScreen';
import MarksEntryScreen from '../screens/MarksEntryScreen';
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
  ChangePassword: undefined;
  PayslipList: undefined;
  PayslipDetail: { payslipId: number; monthName: string; year: number };
  MarksClassSelection: undefined;
  MarksSectionSelection: { classId: number; className: string; sessionId: number };
  MarksSubjectSelection: { classId: number; className: string; sectionId: number; sectionName: string; sessionId: number };
  MarksChapterSelection: { subjectId: number; subjectName: string; sectionId: number; sessionId: number; classId: number; sectionName: string };
  MarksExamSelection: { chapterId: number; chapterName: string; subjectName: string; classId: number; sectionId: number };
  MarksEntry: { examId: number; examName: string; totalMarks: number; passingMarks: number; classId: number; sectionId: number };
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
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: 'Change Password' }}
          />
          <Stack.Screen
            name="PayslipList"
            component={PayslipListScreen}
            options={{ title: 'My Payslips' }}
          />
          <Stack.Screen
            name="PayslipDetail"
            component={PayslipDetailScreen}
            options={({ route }) => ({
              title: `${route.params.monthName} ${route.params.year}`,
            })}
          />
          <Stack.Screen
            name="MarksClassSelection"
            component={MarksClassSelectionScreen}
            options={{ title: 'Select Class' }}
          />
          <Stack.Screen
            name="MarksSectionSelection"
            component={MarksSectionSelectionScreen}
            options={({ route }) => ({ title: `${route.params.className} — Select Section` })}
          />
          <Stack.Screen
            name="MarksSubjectSelection"
            component={MarksSubjectSelectionScreen}
            options={({ route }) => ({ title: `${route.params.sectionName} — Subjects` })}
          />
          <Stack.Screen
            name="MarksChapterSelection"
            component={MarksChapterSelectionScreen}
            options={({ route }) => ({ title: route.params.subjectName })}
          />
          <Stack.Screen
            name="MarksExamSelection"
            component={MarksExamSelectionScreen}
            options={({ route }) => ({ title: route.params.chapterName })}
          />
          <Stack.Screen
            name="MarksEntry"
            component={MarksEntryScreen}
            options={({ route }) => ({ title: `Enter Marks — ${route.params.examName}` })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
