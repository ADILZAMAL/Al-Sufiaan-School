import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { attendanceApi } from '../api/attendance';
import { AttendanceHistoryDay, AttendanceHistoryStudent } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { attendanceTone } from '../lib/attendance';
import { formatRelativeDay, ISO_DATE } from '../lib/date';
import { fullName } from '../lib/rollNumber';
import { usePullToRefresh } from '../hooks/useRefresh';
import { Avatar, Badge, Card, ErrorState, ListRow, SegmentedControl, SkeletonList, StatTile } from '../components/ui';
import { CalendarLegend, DayCell, MonthCalendar, MonthSwitcher } from '../components/MonthCalendar';
import { makeStyles, useTheme } from '../theme';

type View_ = 'days' | 'students';

const dayPercentage = (d: AttendanceHistoryDay) =>
  d.present + d.absent > 0 ? Math.round((d.present / (d.present + d.absent)) * 100) : null;

const AttendanceHistoryScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const { classId, sectionId, className, sectionName } = useRoute<RouteProp<RootStackParamList, 'AttendanceHistory'>>().params;

  const currentMonth = dayjs().format('YYYY-MM');
  const [month, setMonth] = useState(currentMonth);
  const [view, setView] = useState<View_>('days');
  const from = `${month}-01`;
  const to = dayjs(from).endOf('month').format(ISO_DATE);

  const query = useQuery({
    queryKey: queryKeys.attendanceHistory(classId, sectionId, from, to),
    queryFn: () => attendanceApi.getHistory({ classId, sectionId, from, to }),
    placeholderData: keepPreviousData,
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);
  const data = query.data;

  const openDay = (date: string) => navigation.navigate('Attendance', { classId, sectionId, className, sectionName, date });

  const renderDay = (date: string): DayCell => {
    const day = data?.days.find(d => d.date === date);
    const label = dayjs(date).format('D MMMM');
    if (!day || day.status === 'FUTURE') return { tone: 'future', accessibilityLabel: label };
    if (day.status === 'HOLIDAY') return { tone: 'holiday', accessibilityLabel: `${label}, ${day.holidayName ?? 'holiday'}` };
    if (day.status === 'NOT_MARKED') {
      return { tone: 'missing', accessibilityLabel: `${label}, not marked`, onPress: () => openDay(date) };
    }
    const pct = dayPercentage(day);
    const tone = attendanceTone(pct);
    return {
      tone: tone === 'neutral' ? 'plain' : tone,
      accessibilityLabel: `${label}, ${pct}% present${day.status === 'PARTIAL' ? ', partly marked' : ''}`,
      onPress: () => openDay(date),
    };
  };

  const pastDays = useMemo(
    () => (data?.days ?? []).filter(d => d.status !== 'FUTURE').reverse(),
    [data]
  );
  const students = useMemo(
    () =>
      [...(data?.students ?? [])].sort(
        (a, b) => (a.percentage ?? 101) - (b.percentage ?? 101) || b.consecutiveAbsences - a.consecutiveAbsences
      ),
    [data]
  );
  const notMarkedDays = pastDays.filter(d => d.status === 'NOT_MARKED' || d.status === 'PARTIAL').length;

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  const header = (
    <View style={styles.header}>
      <MonthSwitcher month={month} onChange={setMonth} max={currentMonth} />
      <View style={styles.tiles}>
        <StatTile
          label="Avg attendance"
          value={data?.summary.averagePercentage != null ? `${data.summary.averagePercentage}%` : '—'}
          tone={attendanceTone(data?.summary.averagePercentage) === 'danger' ? 'danger' : 'primary'}
        />
        <StatTile label="Days marked" value={`${data?.summary.markedDays ?? 0}/${data?.summary.workingDays ?? 0}`} />
        <StatTile label="Not marked" value={notMarkedDays} tone={notMarkedDays > 0 ? 'danger' : 'success'} />
      </View>
      <SegmentedControl
        options={[
          { value: 'days', label: 'Days' },
          { value: 'students', label: `Students (${data?.totalStudents ?? 0})` },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'days' && (
        <Card>
          <MonthCalendar month={month} renderDay={renderDay} />
          <View style={styles.legend}>
            <CalendarLegend
              items={[
                { tone: 'success', label: '≥90%' },
                { tone: 'warning', label: '75–89%' },
                { tone: 'danger', label: '<75%' },
                { tone: 'missing', label: 'Not marked' },
                { tone: 'holiday', label: 'Holiday' },
              ]}
            />
          </View>
        </Card>
      )}
    </View>
  );

  if (view === 'students') {
    return (
      <FlatList<AttendanceHistoryStudent>
        style={styles.root}
        data={students}
        keyExtractor={s => String(s.studentId)}
        ListHeaderComponent={header}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const tone = attendanceTone(item.percentage);
          return (
            <ListRow
              left={<Avatar firstName={item.firstName} lastName={item.lastName} photo={item.studentPhoto} />}
              title={fullName(item)}
              subtitle={[
                `Roll ${item.rollNumber ?? '—'}`,
                `${item.absent} absent`,
                item.consecutiveAbsences > 1 ? `${item.consecutiveAbsences} in a row` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              right={<Badge label={item.percentage != null ? `${item.percentage}%` : '—'} tone={tone === 'neutral' ? 'neutral' : tone} />}
              onPress={() => navigation.navigate('StudentAttendance', { studentId: item.studentId, studentName: fullName(item) })}
            />
          );
        }}
      />
    );
  }

  return (
    <FlatList<AttendanceHistoryDay>
      style={styles.root}
      data={pastDays}
      keyExtractor={d => d.date}
      ListHeaderComponent={header}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        if (item.status === 'HOLIDAY') {
          return <ListRow icon="sunny-outline" iconColor={colors.textSubtle} iconBackground={colors.holidaySoft} title={formatRelativeDay(item.date)} subtitle={item.holidayName ?? 'Holiday'} />;
        }
        if (item.status === 'NOT_MARKED') {
          return (
            <ListRow
              icon="alert-circle-outline"
              iconColor={colors.danger}
              iconBackground={colors.dangerSoft}
              title={formatRelativeDay(item.date)}
              subtitle="Not marked"
              onPress={() => openDay(item.date)}
            />
          );
        }
        const pct = dayPercentage(item);
        const tone = attendanceTone(pct);
        return (
          <ListRow
            icon="checkmark-done-outline"
            title={formatRelativeDay(item.date)}
            subtitle={[
              `${item.present} present · ${item.absent} absent`,
              item.status === 'PARTIAL' ? `${item.notMarked} unmarked` : null,
              item.lastMarkedBy ? `by ${item.lastMarkedBy}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            right={<Badge label={`${pct}%`} tone={tone === 'neutral' ? 'neutral' : tone} />}
            onPress={() => openDay(item.date)}
          />
        );
      }}
      ListFooterComponent={
        month === currentMonth && pastDays.length === 0 ? <Text style={styles.empty}>No school days yet this month.</Text> : null
      }
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  header: { padding: spacing.lg, gap: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  legend: { marginTop: spacing.md },
  separator: { height: 1, backgroundColor: colors.divider },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
}));

export default AttendanceHistoryScreen;
