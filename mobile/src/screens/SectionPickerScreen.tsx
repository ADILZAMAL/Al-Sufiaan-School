import React, { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { useClasses, useHolidayCheck } from '../hooks/queries';
import { usePullToRefresh } from '../hooks/useRefresh';
import { Card, EmptyState, ErrorState, Icon, SkeletonList } from '../components/ui';
import { HIT_SIZE, makeStyles, useTheme } from '../theme';
import { getErrorMessage } from '../lib/errors';
import { todayISO } from '../lib/date';
import { Class, Section } from '../types';

/** Class → section in one screen (replaces the old two-step picker). */
const SectionPickerScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const { mode } = useRoute<RouteProp<RootStackParamList, 'SectionPicker'>>().params;

  const classesQuery = useClasses();
  const holidayQuery = useHolidayCheck(todayISO());
  const { refreshing, onRefresh } = usePullToRefresh(classesQuery.refetch);

  const classes = useMemo(
    () =>
      (classesQuery.data ?? [])
        .filter(c => c.sections?.length)
        .map(c => ({ ...c, sections: [...c.sections].sort((a, b) => a.name.localeCompare(b.name)) })),
    [classesQuery.data]
  );

  const open = (cls: Class, section: Section) => {
    const params = { classId: cls.id, sectionId: section.id, className: cls.name, sectionName: section.name };
    if (mode === 'attendance') navigation.navigate('Attendance', params);
    else if (mode === 'history') navigation.navigate('AttendanceHistory', params);
    else navigation.navigate('StudentList', params);
  };

  if (classesQuery.isPending) return <SkeletonList />;
  if (classesQuery.isError && !classesQuery.data) {
    return <ErrorState message={getErrorMessage(classesQuery.error)} onRetry={() => classesQuery.refetch()} retrying={classesQuery.isFetching} />;
  }

  const holiday = mode === 'attendance' && holidayQuery.data?.isHoliday ? holidayQuery.data.holiday : null;

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={classes}
      keyExtractor={c => String(c.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={
        holiday ? (
          <View style={styles.holiday} accessibilityRole="alert">
            <Icon name="sunny-outline" size={20} color={colors.warning} />
            <Text style={styles.holidayText}>
              Today is a holiday ({holiday.name}). Attendance can't be marked today.
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={<EmptyState icon="school-outline" title="No classes yet" message="Classes for the current session will appear here." />}
      renderItem={({ item: cls }) => {
        const single = cls.sections.length === 1;
        return (
          <Card
            padded={false}
            onPress={single ? () => open(cls, cls.sections[0]) : undefined}
            accessibilityLabel={single ? `Class ${cls.name}, section ${cls.sections[0].name}` : undefined}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.className}>Class {cls.name}</Text>
              {single && (
                <View style={styles.singleSection}>
                  <Text style={styles.singleSectionText}>Section {cls.sections[0].name}</Text>
                  <Icon name="chevron-forward" size={18} color={colors.textSubtle} />
                </View>
              )}
            </View>
            {!single && (
              <View style={styles.sections}>
                {cls.sections.map(section => (
                  <Pressable
                    key={section.id}
                    onPress={() => open(cls, section)}
                    accessibilityRole="button"
                    accessibilityLabel={`Class ${cls.name}, section ${section.name}`}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  >
                    <Text style={styles.chipText}>{section.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        );
      }}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, radius, typography }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  card: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  className: { ...typography.heading, color: colors.text },
  singleSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  singleSectionText: { ...typography.caption, color: colors.textMuted },
  sections: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    minWidth: HIT_SIZE + 12,
    minHeight: HIT_SIZE,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: { backgroundColor: colors.primary },
  chipText: { ...typography.bodyStrong, color: colors.primaryDark },
  holiday: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  holidayText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
}));

export default SectionPickerScreen;
