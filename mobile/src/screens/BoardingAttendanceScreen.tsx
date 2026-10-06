import React, { useState } from 'react';
import { Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/types';
import { attendanceApi } from '../api/attendance';
import { useCurrentUser } from '../context/AuthContext';
import { useHolidayCheck } from '../hooks/queries';
import { AttendanceType, BoardingStudent } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { todayISO } from '../lib/date';
import { isEditableAttendanceDate } from '../lib/attendance';
import { ErrorState, SkeletonList } from '../components/ui';
import { SheetStudent, useAttendanceSheet } from '../features/attendance/useAttendanceSheet';
import { AttendanceSheetView } from '../features/attendance/components/AttendanceSheetView';

// Server returns boarding students ordered by class, section, roll
const toSheetStudents = (students: BoardingStudent[]): SheetStudent[] =>
  students.map(s => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    rollNumber: s.rollNumber,
    studentPhoto: s.studentPhoto,
    savedStatus: s.attendance?.status ?? null,
    group: s.class ? `Class ${s.class.name}${s.section ? ` – ${s.section.name}` : ''}` : 'No class',
  }));

const BoardingAttendanceScreen: React.FC = () => {
  const { boardingType } = useRoute<RouteProp<RootStackParamList, 'BoardingAttendance'>>().params;
  const user = useCurrentUser();
  const [date, setDate] = useState(todayISO());
  const editable = isEditableAttendanceDate(date);
  const attendanceType = boardingType === 'HOSTEL' ? AttendanceType.HOSTEL : AttendanceType.DAYBOARDING;

  const holidayQuery = useHolidayCheck(date);
  const query = useQuery({
    queryKey: queryKeys.boardingSheet(boardingType, date),
    queryFn: () => attendanceApi.getBoardingStudentsWithAttendance(boardingType, date),
    select: toSheetStudents,
  });

  const sheet = useAttendanceSheet({
    students: query.data,
    date,
    attendanceType,
    draftKey: `att:${user.userId}:${attendanceType}:${date}`,
    editable,
  });

  const refresh = async () => {
    const reload = async () => {
      await query.refetch();
      sheet.reinitialize();
    };
    if (!sheet.hasUserEdits) return reload();
    Alert.alert('Reload attendance?', 'Your unsaved changes will be replaced with what is saved on the server.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reload', style: 'destructive', onPress: reload },
    ]);
  };

  if (query.isPending) return <SkeletonList rows={8} />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  return (
    <AttendanceSheetView
      students={query.data}
      sheet={sheet}
      date={date}
      editable={editable}
      onDateChange={setDate}
      grouped
      holidayName={holidayQuery.data?.isHoliday ? holidayQuery.data.holiday?.name ?? 'Holiday' : null}
      refreshing={query.isRefetching && !sheet.saving}
      onRefresh={refresh}
    />
  );
};

export default BoardingAttendanceScreen;
