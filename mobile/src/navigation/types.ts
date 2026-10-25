import { NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AcademicExam } from '../types';

export type TabParamList = {
  HomeTab: undefined;
  AttendanceTab: undefined;
  AcademicsTab: undefined;
  ProfileTab: undefined;
};

/** A teacher's subject in a section — the context every Academics screen needs. */
export interface SubjectContext {
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  sessionId: number;
}

/** A subject context plus the exam being worked on. */
export type ExamContext = SubjectContext & { examId: number; examName: string; totalMarks: number; passingMarks: number };

/** A section's report card for one exam event. */
export interface ReportContext {
  examEventId: number;
  examEventName: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  sessionId: number;
}

export type RootStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;

  // Attendance & students
  SectionPicker: { mode: 'attendance' | 'students' | 'history' };
  /** `date` (YYYY-MM-DD) defaults to today; dates older than 7 days open read-only. */
  Attendance: { classId: number; sectionId: number; className: string; sectionName: string; date?: string };
  AttendanceHistory: { classId: number; sectionId: number; className: string; sectionName: string };
  StudentAttendance: { studentId: number; studentName: string };
  BoardingAttendance: { boardingType: 'HOSTEL' | 'DAYBOARDING' };
  StudentList: { classId: number; sectionId: number; className: string; sectionName: string };
  StudentProfile: { studentId: number; studentName: string };

  // Academics
  SubjectHome: SubjectContext;
  ClassTestForm: SubjectContext & { exam?: AcademicExam };
  MarksEntry: ExamContext;
  ExamResults: ExamContext;
  ReportCardPicker: undefined;
  SectionReport: ReportContext;
  StudentReportCard: ReportContext & { studentId: number };
  StudentPerformance: { studentId: number; studentName: string; sessionId?: number };

  HolidayCalendar: undefined;

  // Profile
  ChangePassword: undefined;
  PayslipList: undefined;
  PayslipDetail: { payslipId: number; monthName: string; year: number };
};

export type RootNavigation = StackNavigationProp<RootStackParamList>;

/** Navigation from any screen (including tab roots) to a root-stack screen. */
export const useRootNavigation = () => useNavigation<RootNavigation>();
