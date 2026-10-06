import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { academicApi } from '../api/academics';
import { useCurrentUser } from '../context/AuthContext';
import { useSchoolBranding } from '../hooks/queries';
import { usePullToRefresh } from '../hooks/useRefresh';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { toast } from '../lib/feedback';
import { compareRollNumbers } from '../lib/rollNumber';
import { Avatar, Badge, Card, ErrorState, Icon, SegmentedControl, SkeletonList, StatTile } from '../components/ui';
import { computeStats, DISTRIBUTION_BANDS, rankStudents, rosterToEntries, rosterToStudents } from '../features/marks/marks';
import { marksSheetHtml } from '../pdf/templates/marksSheet';
import { shareHtmlAsPdf } from '../pdf/shareHtmlAsPdf';
import { makeStyles, useTheme } from '../theme';

/** Results of one exam for a section: stats, distribution and ranked list. */
const ExamResultsScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const user = useCurrentUser();
  const ctx = useRoute<RouteProp<RootStackParamList, 'ExamResults'>>().params;
  const [order, setOrder] = useState<'rank' | 'roll'>('rank');
  const [sharing, setSharing] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.marks(ctx.examId, ctx.sectionId),
    queryFn: () => academicApi.getMarksRoster(ctx.examId, ctx.sectionId, ctx.sessionId),
  });
  const branding = useSchoolBranding();
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);

  const { ranked, stats } = useMemo(() => {
    const students = rosterToStudents(query.data ?? []);
    const entries = rosterToEntries(query.data ?? []);
    return {
      ranked: rankStudents(students, entries, ctx.totalMarks, ctx.passingMarks),
      stats: computeStats(students, entries, ctx.passingMarks),
    };
  }, [query.data, ctx.totalMarks, ctx.passingMarks]);

  const rows = useMemo(
    () => (order === 'rank' ? ranked : [...ranked].sort((a, b) => compareRollNumbers(a.student.rollNumber, b.student.rollNumber))),
    [ranked, order]
  );

  const bands = useMemo(() => {
    const counts = DISTRIBUTION_BANDS.map(() => 0);
    ranked.forEach(r => {
      if (r.percentage === null) return;
      const i = DISTRIBUTION_BANDS.findIndex(b => r.percentage! >= b.min);
      counts[i === -1 ? counts.length - 1 : i]++;
    });
    const max = Math.max(1, ...counts);
    return DISTRIBUTION_BANDS.map((b, i) => ({ ...b, count: counts[i], width: counts[i] / max }));
  }, [ranked]);

  const share = async () => {
    if (!branding.data) {
      toast.error('School details are still loading', 'Try again in a moment.');
      return;
    }
    setSharing(true);
    try {
      await shareHtmlAsPdf(
        marksSheetHtml({
          branding: branding.data,
          examName: ctx.examName,
          subjectName: ctx.subjectName,
          className: ctx.className,
          sectionName: ctx.sectionName,
          totalMarks: ctx.totalMarks,
          passingMarks: ctx.passingMarks,
          teacherName: user.staffName,
          rows: ranked,
          stats,
        }),
        `${ctx.subjectName}-${ctx.examName}-${ctx.className}${ctx.sectionName}`
      );
    } catch (error) {
      toast.error("Couldn't create the PDF", getErrorMessage(error));
    } finally {
      setSharing(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${ctx.examName} · Results`,
      headerRight: () =>
        sharing ? (
          <ActivityIndicator color={colors.primary} style={{ paddingHorizontal: 16 }} />
        ) : (
          <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Share marks sheet as PDF" hitSlop={10} style={{ paddingHorizontal: 16 }}>
            <Icon name="share-outline" size={22} color={colors.primary} />
          </Pressable>
        ),
    });
  });

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  const scored = stats.passed + stats.failed;

  return (
    <FlatList
      style={styles.root}
      data={rows}
      keyExtractor={r => String(r.student.studentId)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.context}>
            {ctx.subjectName} · Class {ctx.className} – {ctx.sectionName} · out of {ctx.totalMarks}
          </Text>
          <View style={styles.tiles}>
            <StatTile label="Highest" value={stats.highest ?? '—'} tone="success" />
            <StatTile label="Average" value={stats.average ?? '—'} tone="primary" />
            <StatTile label="Lowest" value={stats.lowest ?? '—'} tone="danger" />
          </View>
          <View style={styles.tiles}>
            <StatTile label="Passed" value={scored ? `${Math.round((stats.passed / scored) * 100)}%` : '—'} />
            <StatTile label="Absent" value={stats.absent} />
            <StatTile label="Not entered" value={stats.notEntered} tone={stats.notEntered ? 'warning' : 'default'} />
          </View>
          {scored > 0 && (
            <Card>
              <Text style={styles.cardTitle}>Score distribution</Text>
              {bands.map(b => (
                <View key={b.label} style={styles.band} accessible accessibilityLabel={`${b.label}: ${b.count} students`}>
                  <Text style={styles.bandLabel}>{b.label}</Text>
                  <View style={styles.bandTrack}>
                    <View style={[styles.bandFill, { flex: b.width }]} />
                    <View style={{ flex: 1 - b.width }} />
                  </View>
                  <Text style={styles.bandCount}>{b.count}</Text>
                </View>
              ))}
            </Card>
          )}
          <SegmentedControl
            options={[
              { value: 'rank', label: 'By rank' },
              { value: 'roll', label: 'By roll no.' },
            ]}
            value={order}
            onChange={setOrder}
          />
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <View style={styles.row} accessible accessibilityLabel={`${item.student.name}, ${item.absent ? 'absent' : item.marks === null ? 'not entered' : `${item.marks} out of ${ctx.totalMarks}, rank ${item.rank}`}`}>
          <Text style={styles.rank}>{item.rank ?? '–'}</Text>
          <Avatar firstName={item.student.firstName} lastName={item.student.lastName} photo={item.student.photo} size={36} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.student.name}
            </Text>
            <Text style={styles.roll}>Roll {item.student.rollNumber ?? '—'}</Text>
          </View>
          {item.absent ? (
            <Badge label="Absent" tone="neutral" />
          ) : item.marks === null ? (
            <Text style={styles.missing}>Not entered</Text>
          ) : (
            <View style={styles.score}>
              <Text style={[styles.marks, { color: item.passed ? colors.text : colors.danger }]}>
                {item.marks}
                <Text style={styles.outOf}>/{ctx.totalMarks}</Text>
              </Text>
              <Text style={[styles.pct, { color: item.passed ? colors.success : colors.danger }]}>
                {item.percentage}% · {item.passed ? 'Pass' : 'Fail'}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  header: { padding: spacing.lg, gap: spacing.md },
  context: { ...typography.caption, color: colors.textMuted },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  cardTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  band: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: 3 },
  bandLabel: { ...typography.small, color: colors.textMuted, width: 58 },
  bandTrack: { flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, flexDirection: 'row', overflow: 'hidden' },
  bandFill: { backgroundColor: colors.primary, borderRadius: radius.pill },
  bandCount: { ...typography.small, color: colors.textSecondary, width: 22, textAlign: 'right' },
  separator: { height: 1, backgroundColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, backgroundColor: colors.surface },
  rank: { ...typography.bodyStrong, color: colors.textMuted, width: 24, textAlign: 'center' },
  info: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.text },
  roll: { ...typography.small, color: colors.textMuted },
  missing: { ...typography.caption, color: colors.warning },
  score: { alignItems: 'flex-end' },
  marks: { ...typography.heading },
  outOf: { ...typography.caption, color: colors.textMuted },
  pct: { ...typography.small },
}));

export default ExamResultsScreen;
