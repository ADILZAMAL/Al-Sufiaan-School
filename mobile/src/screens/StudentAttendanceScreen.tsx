import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { RootStackParamList } from '../navigation/types';
import { attendanceApi } from '../api/attendance';
import { AttendanceStatus, AttendanceType } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { formatRelativeDay } from '../lib/date';
import { usePullToRefresh } from '../hooks/useRefresh';
import { Card, ErrorState, ListRow, Screen, SectionHeader, SkeletonList, StatTile } from '../components/ui';
import { CalendarLegend, DayCell, MonthCalendar, MonthSwitcher } from '../components/MonthCalendar';
import { makeStyles, useTheme } from '../theme';

/** One student's class attendance for the current session, month by month. */
const StudentAttendanceScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { studentId } = useRoute<RouteProp<RootStackParamList, 'StudentAttendance'>>().params;
  const currentMonth = dayjs().format('YYYY-MM');
  const [month, setMonth] = useState(currentMonth);

  const query = useQuery({
    queryKey: queryKeys.studentCalendar(studentId),
    queryFn: () => attendanceApi.getStudentCalendar(studentId),
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);

  const { classByDate, holidayByDate, firstMonth } = useMemo(() => {
    const classMap = new Map<string, { status: AttendanceStatus; remarks: string | null }>();
    const holidayMap = new Map<string, string>();
    for (const r of query.data?.attendanceRecords ?? []) {
      if (r.status === 'HOLIDAY') holidayMap.set(r.date, r.name);
      else if (r.attendanceType === AttendanceType.CLASS) classMap.set(r.date, { status: r.status, remarks: r.remarks });
    }
    const dates = Array.from(classMap.keys()).sort();
    return { classByDate: classMap, holidayByDate: holidayMap, firstMonth: dates[0]?.slice(0, 7) };
  }, [query.data]);

  const absences = useMemo(
    () =>
      Array.from(classByDate.entries())
        .filter(([date, r]) => date.startsWith(month) && r.status === AttendanceStatus.ABSENT)
        .sort(([a], [b]) => b.localeCompare(a)),
    [classByDate, month]
  );

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  const summary = query.data.summary;

  const renderDay = (date: string): DayCell => {
    const label = dayjs(date).format('D MMMM');
    const record = classByDate.get(date);
    if (record?.status === AttendanceStatus.PRESENT) return { tone: 'success', accessibilityLabel: `${label}, present` };
    if (record?.status === AttendanceStatus.ABSENT) return { tone: 'danger', accessibilityLabel: `${label}, absent` };
    const holiday = holidayByDate.get(date);
    if (holiday) return { tone: 'holiday', accessibilityLabel: `${label}, ${holiday}` };
    return { tone: date > dayjs().format('YYYY-MM-DD') ? 'future' : 'plain', accessibilityLabel: `${label}, not marked` };
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {!!query.data.class && (
        <Text style={styles.subtitle}>
          Class {query.data.class}
          {query.data.section ? ` – ${query.data.section}` : ''} · this session
        </Text>
      )}
      <View style={styles.tiles}>
        <StatTile
          label="Attendance"
          value={summary.class.totalWorkingDays ? `${summary.class.attendancePercentage}%` : '—'}
          tone={summary.class.attendancePercentage >= 75 ? 'primary' : 'danger'}
        />
        <StatTile label="Present" value={summary.class.totalPresent} tone="success" />
        <StatTile label="Absent" value={summary.class.totalAbsent} tone="danger" />
      </View>

      <Card>
        <MonthSwitcher month={month} onChange={setMonth} max={currentMonth} min={firstMonth} />
        <View style={styles.calendar}>
          <MonthCalendar month={month} renderDay={renderDay} />
        </View>
        <CalendarLegend
          items={[
            { tone: 'success', label: 'Present' },
            { tone: 'danger', label: 'Absent' },
            { tone: 'holiday', label: 'Holiday' },
          ]}
        />
      </Card>

      {(summary.hostel || summary.dayboarding) && (
        <>
          <SectionHeader title="Boarding" />
          <Card padded={false}>
            {summary.hostel && (
              <ListRow
                icon="bed-outline"
                title="Hostel"
                subtitle={`${summary.hostel.totalPresent} present · ${summary.hostel.totalAbsent} absent`}
                right={<Text style={styles.pct}>{summary.hostel.attendancePercentage}%</Text>}
              />
            )}
            {summary.dayboarding && (
              <ListRow
                icon="sunny-outline"
                title="Dayboarding"
                subtitle={`${summary.dayboarding.totalPresent} present · ${summary.dayboarding.totalAbsent} absent`}
                right={<Text style={styles.pct}>{summary.dayboarding.attendancePercentage}%</Text>}
              />
            )}
          </Card>
        </>
      )}

      <SectionHeader title={`Absences in ${dayjs(`${month}-01`).format('MMMM')}`} />
      {absences.length === 0 ? (
        <Text style={styles.none}>No absences this month.</Text>
      ) : (
        <Card padded={false}>
          {absences.map(([date, r]) => (
            <ListRow
              key={date}
              icon="close-circle-outline"
              iconColor={colors.absent}
              iconBackground={colors.absentSoft}
              title={formatRelativeDay(date)}
              subtitle={r.remarks ?? undefined}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  subtitle: { ...typography.caption, color: colors.textMuted, marginBottom: -spacing.sm },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  calendar: { marginVertical: spacing.md },
  pct: { ...typography.bodyStrong, color: colors.text },
  none: { ...typography.body, color: colors.textMuted },
}));

export default StudentAttendanceScreen;
