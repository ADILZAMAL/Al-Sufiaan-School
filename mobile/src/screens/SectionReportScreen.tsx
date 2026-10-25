import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { usePullToRefresh } from '../hooks/useRefresh';
import { getErrorMessage } from '../lib/errors';
import { compareRollNumbers } from '../lib/rollNumber';
import { Badge, EmptyState, ErrorState, Icon, SegmentedControl, SkeletonList, StatTile } from '../components/ui';
import { formatPct, gradeTone, ordinal } from '../features/reports/format';
import { useEventReport } from '../features/reports/useEventReport';
import { makeStyles, useTheme } from '../theme';

/** Ranked results of a section for one exam event. */
const SectionReportScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const ctx = useRoute<RouteProp<RootStackParamList, 'SectionReport'>>().params;
  const { query, share, sharing } = useEventReport(ctx);
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);
  const [order, setOrder] = useState<'rank' | 'roll'>('rank');
  const report = query.data;

  const rows = useMemo(() => {
    if (!report) return [];
    const list = report.students.map(student => ({ student, summary: report.summaries.find(s => s.studentId === student.studentId) }));
    if (order === 'roll') return list.sort((a, b) => compareRollNumbers(a.student.rollNumber, b.student.rollNumber));
    return list.sort((a, b) => (a.summary?.rank ?? Infinity) - (b.summary?.rank ?? Infinity));
  }, [report, order]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${ctx.examEventName} · ${ctx.className}–${ctx.sectionName}`,
      headerRight: () =>
        sharing ? (
          <ActivityIndicator color={colors.primary} style={{ paddingHorizontal: 16 }} />
        ) : report && report.students.length > 0 ? (
          <Pressable
            onPress={() => share(rows.map(r => r.student.studentId), `Report-cards-${ctx.examEventName}-${ctx.className}${ctx.sectionName}`)}
            accessibilityRole="button"
            accessibilityLabel="Share all report cards as PDF"
            hitSlop={10}
            style={{ paddingHorizontal: 16 }}
          >
            <Icon name="share-outline" size={22} color={colors.primary} />
          </Pressable>
        ) : null,
    });
  });

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !report) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }
  if (!report) return null;

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
          <View style={styles.tiles}>
            <StatTile label="Class average" value={formatPct(report.classStats.averagePercentage)} tone="primary" />
            <StatTile label="Highest" value={formatPct(report.classStats.highestPercentage)} tone="success" />
            <StatTile label="Subjects" value={report.subjects.length} />
          </View>
          {report.subjects.length === 0 && (
            <Text style={styles.note}>No subject papers are set up for this exam yet.</Text>
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
      ListEmptyComponent={<EmptyState icon="people-outline" title="No students" message="No active students are enrolled in this section." />}
      renderItem={({ item: { student, summary } }) => (
        <Pressable
          onPress={() => navigation.navigate('StudentReportCard', { ...ctx, studentId: student.studentId })}
          accessibilityRole="button"
          accessibilityLabel={`${student.studentName}, ${summary?.rank ? `${ordinal(summary.rank)} position, ` : ''}${formatPct(summary?.percentage)}`}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.rank}>{summary?.rank ?? '–'}</Text>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {student.studentName}
            </Text>
            <Text style={styles.meta}>
              Roll {student.rollNumber ?? '—'}
              {summary && summary.attempted > 0 ? ` · ${summary.obtained}/${summary.maxTotal}` : ' · no marks'}
              {summary?.failedSubjects ? ` · ${summary.failedSubjects} below pass` : ''}
            </Text>
          </View>
          <Text style={styles.pct}>{formatPct(summary?.percentage)}</Text>
          {summary?.grade ? <Badge label={summary.grade} tone={gradeTone(summary.grade)} /> : null}
          <Icon name="chevron-forward" size={18} color={colors.textSubtle} />
        </Pressable>
      )}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { padding: spacing.lg, gap: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  note: { ...typography.caption, color: colors.warning },
  separator: { height: 1, backgroundColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface },
  pressed: { backgroundColor: colors.surfaceMuted },
  rank: { ...typography.heading, color: colors.textMuted, width: 28, textAlign: 'center' },
  info: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.text },
  meta: { ...typography.small, color: colors.textMuted },
  pct: { ...typography.bodyStrong, color: colors.text },
}));

export default SectionReportScreen;
