import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { attendanceApi } from '../api/attendance';
import { useCurrentUser } from '../context/AuthContext';
import { useHolidayCheck } from '../hooks/queries';
import { AttendanceType, Student } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { todayISO } from '../lib/date';
import { isEditableAttendanceDate } from '../lib/attendance';
import { sortByRoll } from '../lib/rollNumber';
import { ErrorState, Icon, SkeletonList } from '../components/ui';
import { useTheme } from '../theme';
import { SheetStudent, useAttendanceSheet } from '../features/attendance/useAttendanceSheet';
import { AttendanceSheetView } from '../features/attendance/components/AttendanceSheetView';

const toSheetStudents = (students: Student[]): SheetStudent[] =>
  sortByRoll(students).map(s => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    rollNumber: s.rollNumber,
    studentPhoto: s.studentPhoto,
    savedStatus: s.attendance?.status ?? null,
    consecutiveAbsences: s.consecutiveAbsences ?? s.daysAbsentSinceLastPresent ?? 0,
  }));

const TakeAttendanceScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Attendance'>>();
  const { classId, sectionId, className, sectionName } = route.params;
  const user = useCurrentUser();

  const [date, setDate] = useState(route.params.date ?? todayISO());
  const editable = isEditableAttendanceDate(date);

  const holidayQuery = useHolidayCheck(date);
  const query = useQuery({
    queryKey: queryKeys.attendanceSheet(classId, sectionId, date),
    queryFn: () => attendanceApi.getStudentsWithAttendance(classId, sectionId, date),
    select: toSheetStudents,
  });

  const sheet = useAttendanceSheet({
    students: query.data,
    date,
    attendanceType: AttendanceType.CLASS,
    draftKey: `att:${user.userId}:CLASS:${classId}:${sectionId}:${date}`,
    editable,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('AttendanceHistory', { classId, sectionId, className, sectionName })}
          accessibilityRole="button"
          accessibilityLabel="Attendance history"
          hitSlop={10}
          style={{ paddingHorizontal: 16 }}
        >
          <Icon name="calendar-outline" size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, classId, sectionId, className, sectionName, colors.primary]);

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
      holidayName={holidayQuery.data?.isHoliday ? holidayQuery.data.holiday?.name ?? 'Holiday' : null}
      refreshing={query.isRefetching && !sheet.saving}
      onRefresh={refresh}
    />
  );
};

export default TakeAttendanceScreen;
