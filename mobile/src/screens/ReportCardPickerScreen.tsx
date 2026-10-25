import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRootNavigation } from '../navigation/types';
import { academicApi } from '../api/academics';
import { useMyAssignments } from '../hooks/queries';
import { usePullToRefresh } from '../hooks/useRefresh';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { Card, EmptyState, ErrorState, Screen, SkeletonList } from '../components/ui';
import { HIT_SIZE, makeStyles, useTheme } from '../theme';

/** Pick a section you teach and an exam to open its report cards. */
const ReportCardPickerScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const assignments = useMyAssignments();
  const sessionId = assignments.data?.session?.id;

  const events = useQuery({
    queryKey: queryKeys.examEvents(sessionId ?? 0),
    queryFn: () => academicApi.getExamEvents(sessionId!),
    enabled: !!sessionId,
  });
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([assignments.refetch(), events.refetch()]);
  });

  const sections = useMemo(() => {
    const map = new Map<number, { classId: number; className: string; sectionId: number; sectionName: string; subjects: string[] }>();
    for (const a of assignments.data?.assignments ?? []) {
      const entry = map.get(a.section.id) ?? { classId: a.class.id, className: a.class.name, sectionId: a.section.id, sectionName: a.section.name, subjects: [] };
      entry.subjects.push(a.subject.name);
      map.set(a.section.id, entry);
    }
    return Array.from(map.values());
  }, [assignments.data]);

  if (assignments.isPending || (sessionId && events.isPending)) return <SkeletonList rows={4} />;
  const error = assignments.error ?? events.error;
  if (error && !(assignments.data && events.data)) {
    return <ErrorState message={getErrorMessage(error)} onRetry={onRefresh} retrying={refreshing} />;
  }
  if (sections.length === 0) {
    return <EmptyState icon="school-outline" title="No sections" message="Report cards appear for sections where you teach a subject." />;
  }
  if (!events.data?.length) {
    return <EmptyState icon="calendar-outline" title="No exams yet" message="Report cards are available once the office sets up an exam (e.g. Unit Test, Half Yearly)." />;
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <Text style={styles.intro}>Choose a class and exam</Text>
      {sections.map(section => (
        <Card key={section.sectionId} style={styles.card}>
          <Text style={styles.title}>
            Class {section.className} – {section.sectionName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            You teach {section.subjects.join(', ')}
          </Text>
          <View style={styles.chips}>
            {events.data.filter(event => (event.classIds ?? []).includes(section.classId)).length === 0 && (
              <Text style={styles.subtitle}>No exams set up for this class yet.</Text>
            )}
            {events.data.filter(event => (event.classIds ?? []).includes(section.classId)).map(event => (
              <Pressable
                key={event.id}
                onPress={() =>
                  navigation.navigate('SectionReport', {
                    examEventId: event.id,
                    examEventName: event.name,
                    classId: section.classId,
                    className: section.className,
                    sectionId: section.sectionId,
                    sectionName: section.sectionName,
                    sessionId: sessionId!,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${event.name} report cards for class ${section.className} ${section.sectionName}`}
                style={({ pressed }) => [styles.chip, pressed && { backgroundColor: colors.primary }]}
              >
                <Text style={styles.chipText}>{event.name}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  content: { gap: spacing.md },
  intro: { ...typography.caption, color: colors.textMuted },
  card: { gap: spacing.xs },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    minHeight: HIT_SIZE - 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
  },
  chipText: { ...typography.bodyStrong, color: colors.primaryDark },
}));

export default ReportCardPickerScreen;
