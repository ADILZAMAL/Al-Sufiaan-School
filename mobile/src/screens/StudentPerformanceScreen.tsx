import React from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/types';
import { academicApi } from '../api/academics';
import { useActiveSession } from '../hooks/queries';
import { usePullToRefresh } from '../hooks/useRefresh';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { attendanceTone } from '../lib/attendance';
import { Card, EmptyState, ErrorState, Screen, SkeletonList } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

/** A student's results across the session, subject by subject. */
const StudentPerformanceScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const params = useRoute<RouteProp<RootStackParamList, 'StudentPerformance'>>().params;
  const activeSession = useActiveSession();
  const sessionId = params.sessionId ?? activeSession.data?.id;

  const query = useQuery({
    queryKey: queryKeys.annualReport(params.studentId, sessionId ?? 0),
    queryFn: () => academicApi.getAnnualReportCard(params.studentId, sessionId!),
    enabled: !!sessionId,
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);

  if (!sessionId && activeSession.isPending) return <SkeletonList rows={4} />;
  if (!sessionId) return <EmptyState icon="calendar-outline" title="No active session" />;
  if (query.isPending) return <SkeletonList rows={4} />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  const data = query.data;
  const toneColor = (pct: number | null) => {
    const tone = attendanceTone(pct);
    return tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.textSubtle;
  };

  const Bar: React.FC<{ label: string; pct: number | null; detail: string }> = ({ label, pct, detail }) => (
    <View style={styles.bar} accessible accessibilityLabel={`${label}: ${pct === null ? 'no marks' : `${pct}%`}, ${detail}`}>
      <Text style={styles.barLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        <View style={{ flex: (pct ?? 0) / 100, backgroundColor: toneColor(pct), borderRadius: 999 }} />
        <View style={{ flex: 1 - (pct ?? 0) / 100 }} />
      </View>
      <Text style={styles.barValue}>{pct === null ? '—' : `${pct}%`}</Text>
    </View>
  );

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {data.enrollment && (
        <Text style={styles.meta}>
          Class {data.enrollment.class?.name} – {data.enrollment.section?.name} · Roll {data.enrollment.rollNumber ?? '—'}
        </Text>
      )}
      {data.subjects.length === 0 && <EmptyState icon="book-outline" title="No results yet" />}
      {data.subjects.map(subject => (
        <Card key={subject.subjectId} style={styles.card}>
          <Text style={styles.subject}>{subject.subjectName}</Text>
          <Bar
            label="Class tests"
            pct={subject.classTestAvg.percentage}
            detail={`${subject.classTestAvg.count} test${subject.classTestAvg.count === 1 ? '' : 's'}`}
          />
          {subject.examEvents.map(event => {
            const pct =
              event.marksObtained !== null && event.totalMarks ? Math.round((event.marksObtained / event.totalMarks) * 100) : null;
            return (
              <Bar
                key={event.eventId}
                label={event.eventName}
                pct={event.isAbsent ? null : pct}
                detail={event.isAbsent ? 'absent' : event.marksObtained !== null ? `${event.marksObtained}/${event.totalMarks}` : 'not entered'}
              />
            );
          })}
        </Card>
      ))}
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  meta: { ...typography.caption, color: colors.textMuted, marginBottom: -spacing.sm },
  card: { gap: spacing.sm },
  subject: { ...typography.heading, color: colors.text, marginBottom: spacing.xs },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { ...typography.caption, color: colors.textSecondary, width: 96 },
  track: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.surfaceMuted, flexDirection: 'row', overflow: 'hidden' },
  barValue: { ...typography.small, color: colors.textSecondary, width: 40, textAlign: 'right' },
}));

export default StudentPerformanceScreen;
