import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useCurrentUser } from '../context/AuthContext';
import { useRootNavigation } from '../navigation/types';
import { attendanceApi } from '../api/attendance';
import { holidayApi } from '../api/holiday';
import { useMyAssignments } from '../hooks/queries';
import { usePullToRefresh } from '../hooks/useRefresh';
import { Badge, Card, Icon, IconName, ListRow, SectionHeader } from '../components/ui';
import { makeStyles, useTheme } from '../theme';
import { addDaysISO, formatLongDate, greetingForNow, todayISO } from '../lib/date';
import { queryKeys } from '../lib/queryKeys';

interface QuickAction {
  key: string;
  title: string;
  icon: IconName;
  onPress: () => void;
}

const HomeScreen: React.FC = () => {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const rootNav = useRootNavigation();
  const tabNav = useNavigation<any>();
  const today = todayISO();

  const assignments = useMyAssignments();
  const dayStats = useQuery({
    queryKey: queryKeys.dayStats(today),
    queryFn: () => attendanceApi.getAllStats(today),
    staleTime: 60 * 1000,
  });
  const holidays = useQuery({
    queryKey: queryKeys.holidays(today, addDaysISO(today, 45)),
    queryFn: () => holidayApi.getHolidays(today, addDaysISO(today, 45)),
    staleTime: 60 * 60 * 1000,
    meta: { persist: true },
  });
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([assignments.refetch(), dayStats.refetch(), holidays.refetch()]);
  });

  // Light status bar over the blue header while Home is visible
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      dayStats.refetch();
      return () => StatusBar.setBarStyle(scheme === 'dark' ? 'light-content' : 'dark-content');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheme])
  );

  const firstName = user.staffName?.split(' ')[0] ?? 'Teacher';

  // Sections this teacher teaches, with today's attendance status
  const mySections = useMemo(() => {
    const seen = new Map<number, { classId: number; className: string; sectionId: number; sectionName: string }>();
    for (const a of assignments.data?.assignments ?? []) {
      if (!seen.has(a.section.id)) seen.set(a.section.id, { classId: a.class.id, className: a.class.name, sectionId: a.section.id, sectionName: a.section.name });
    }
    return Array.from(seen.values()).map(s => ({
      ...s,
      stats: dayStats.data?.classStats.find(c => c.sectionId === s.sectionId),
    }));
  }, [assignments.data, dayStats.data]);

  const pending = (assignments.data?.assignments ?? []).filter(a => (a.progress?.pendingExamCount ?? 0) > 0);
  const upcoming = (holidays.data ?? [])
    .filter(h => h.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);
  const isHolidayToday = dayStats.data?.isHoliday;

  const actions: QuickAction[] = [
    { key: 'attendance', title: 'Attendance', icon: 'checkmark-done-circle-outline', onPress: () => rootNav.navigate('SectionPicker', { mode: 'attendance' }) },
    { key: 'marks', title: 'Marks', icon: 'create-outline', onPress: () => tabNav.navigate('AcademicsTab') },
    { key: 'reports', title: 'Report cards', icon: 'ribbon-outline', onPress: () => rootNav.navigate('ReportCardPicker') },
    { key: 'students', title: 'Students', icon: 'people-outline', onPress: () => rootNav.navigate('SectionPicker', { mode: 'students' }) },
    { key: 'hostel', title: 'Hostel', icon: 'bed-outline', onPress: () => rootNav.navigate('BoardingAttendance', { boardingType: 'HOSTEL' }) },
    { key: 'dayboarding', title: 'Dayboarding', icon: 'sunny-outline', onPress: () => rootNav.navigate('BoardingAttendance', { boardingType: 'DAYBOARDING' }) },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.onHero} />}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.date}>{formatLongDate(today)}</Text>
        <Text style={styles.greeting} accessibilityRole="header">
          {greetingForNow()}, {firstName}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.grid}>
          {actions.map(action => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle} numberOfLines={1}>
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View>

        {mySections.length > 0 && (
          <>
            <SectionHeader title="Today's attendance" />
            <Card padded={false} style={styles.group}>
              {isHolidayToday ? (
                <ListRow icon="sunny-outline" title="No school today" subtitle={dayStats.data?.holidayName ?? 'Holiday'} />
              ) : (
                mySections.map((s, i) => {
                  const marked = s.stats && s.stats.totalMarked > 0;
                  const complete = s.stats && s.stats.notMarked === 0 && s.stats.totalStudents > 0;
                  return (
                    <View key={s.sectionId}>
                      {i > 0 && <View style={styles.divider} />}
                      <ListRow
                        icon={complete ? 'checkmark-circle' : 'time-outline'}
                        iconColor={complete ? colors.success : colors.warning}
                        iconBackground={complete ? colors.successSoft : colors.warningSoft}
                        title={`Class ${s.className} – ${s.sectionName}`}
                        subtitle={
                          !s.stats
                            ? 'Loading…'
                            : complete
                              ? `${s.stats.presentCount} present · ${s.stats.absentCount} absent`
                              : marked
                                ? `${s.stats.notMarked} of ${s.stats.totalStudents} not marked`
                                : 'Not marked yet'
                        }
                        right={!complete ? <Badge label="Mark" tone="primary" /> : undefined}
                        onPress={() =>
                          rootNav.navigate('Attendance', { classId: s.classId, sectionId: s.sectionId, className: s.className, sectionName: s.sectionName })
                        }
                      />
                    </View>
                  );
                })
              )}
            </Card>
          </>
        )}

        {pending.length > 0 && (
          <>
            <SectionHeader title="Marks to enter" />
            <Card padded={false} style={styles.group}>
              {pending.slice(0, 5).map((a, i) => (
                <View key={a.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <ListRow
                    icon="create-outline"
                    title={a.subject.name}
                    subtitle={`Class ${a.class.name} – ${a.section.name}`}
                    right={<Badge label={`${a.progress!.pendingExamCount} exam${a.progress!.pendingExamCount === 1 ? '' : 's'}`} tone="warning" />}
                    onPress={() =>
                      rootNav.navigate('SubjectHome', {
                        subjectId: a.subject.id,
                        subjectName: a.subject.name,
                        classId: a.class.id,
                        className: a.class.name,
                        sectionId: a.section.id,
                        sectionName: a.section.name,
                        sessionId: a.sessionId,
                      })
                    }
                  />
                </View>
              ))}
            </Card>
          </>
        )}

        <SectionHeader
          title="Upcoming holidays"
          right={
            <Pressable onPress={() => rootNav.navigate('HolidayCalendar')} accessibilityRole="button" hitSlop={10}>
              <Text style={styles.link}>Calendar</Text>
            </Pressable>
          }
        />
        <Card padded={false} style={styles.group}>
          {upcoming.length === 0 ? (
            <ListRow icon="calendar-outline" title="No holidays in the next few weeks" onPress={() => rootNav.navigate('HolidayCalendar')} />
          ) : (
            upcoming.map((h, i) => (
              <View key={h.id}>
                {i > 0 && <View style={styles.divider} />}
                <ListRow
                  icon="sunny-outline"
                  iconColor={colors.warning}
                  iconBackground={colors.warningSoft}
                  title={h.name}
                  subtitle={
                    h.startDate === h.endDate
                      ? dayjs(h.startDate).format('dddd, D MMM')
                      : `${dayjs(h.startDate).format('D MMM')} – ${dayjs(h.endDate).format('D MMM')}`
                  }
                />
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius, shadow }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.hero,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  date: { ...typography.caption, color: colors.onHeroMuted },
  greeting: { ...typography.display, color: colors.onHero, marginTop: spacing.xs },
  body: { padding: spacing.lg, gap: spacing.lg, marginTop: -spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  action: { width: '33.33%', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  pressed: { opacity: 0.6 },
  actionIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { ...typography.small, color: colors.textSecondary },
  group: { overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg + 38 + spacing.md },
  link: { ...typography.small, color: colors.primary },
}));

export default HomeScreen;
