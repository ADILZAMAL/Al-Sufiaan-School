import React from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { getErrorMessage } from '../lib/errors';
import { Badge, Button, Card, ErrorState, ListRow, Screen, SkeletonList, StatTile } from '../components/ui';
import { formatPct, gradeTone, ordinal, summaryFor } from '../features/reports/format';
import { useEventReport } from '../features/reports/useEventReport';
import { makeStyles, useTheme } from '../theme';

/** One student's report card for an exam event. */
const StudentReportCardScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const { studentId, ...ctx } = useRoute<RouteProp<RootStackParamList, 'StudentReportCard'>>().params;
  const { query, share, sharing } = useEventReport(ctx);

  if (query.isPending) return <SkeletonList rows={5} />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }
  const report = query.data!;
  const student = report.students.find(s => s.studentId === studentId);
  if (!student) return <ErrorState message="This student isn't in the section anymore." />;
  const summary = summaryFor(report, studentId);

  return (
    <Screen>
      <View>
        <Text style={styles.name}>{student.studentName}</Text>
        <Text style={styles.meta}>
          {ctx.examEventName} · Class {ctx.className} – {ctx.sectionName} · Roll {student.rollNumber ?? '—'}
        </Text>
      </View>

      <View style={styles.tiles}>
        <StatTile label="Percentage" value={formatPct(summary?.percentage)} tone="primary" />
        <StatTile label="Grade" value={summary?.grade ?? '—'} tone={summary?.grade?.startsWith('E') ? 'danger' : 'success'} />
        <StatTile label={summary?.rank ? `of ${summary.rankOf}` : 'Position'} value={summary?.rank ? ordinal(summary.rank) : '—'} />
      </View>

      <Card padded={false}>
        <View style={[styles.tableRow, styles.tableHead]}>
          <Text style={[styles.cellSubject, styles.headText]}>Subject</Text>
          <Text style={[styles.cell, styles.headText]}>Marks</Text>
          <Text style={[styles.cell, styles.headText]}>Grade</Text>
        </View>
        {report.subjects.map(subject => {
          const mark = subject.marks.find(m => m.studentId === studentId);
          const failed = mark && !mark.isAbsent && mark.marksObtained !== null && mark.marksObtained < subject.passingMarks;
          return (
            <View
              key={subject.examId}
              style={styles.tableRow}
              accessible
              accessibilityLabel={`${subject.subjectName}: ${mark?.isAbsent ? 'absent' : mark?.marksObtained ?? 'not entered'} out of ${subject.totalMarks}${mark?.grade ? `, grade ${mark.grade}` : ''}`}
            >
              <Text style={styles.cellSubject} numberOfLines={2}>
                {subject.subjectName}
              </Text>
              <Text style={[styles.cell, failed && { color: colors.danger, fontWeight: '700' }]}>
                {mark?.isAbsent ? 'AB' : mark?.marksObtained ?? '—'}
                <Text style={styles.outOf}>/{subject.totalMarks}</Text>
              </Text>
              <View style={styles.cellCenter}>{mark?.grade ? <Badge label={mark.grade} tone={gradeTone(mark.grade)} /> : <Text style={styles.outOf}>—</Text>}</View>
            </View>
          );
        })}
        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.cellSubject, styles.totalText]}>Total</Text>
          <Text style={[styles.cell, styles.totalText]}>
            {summary && summary.attempted > 0 ? `${summary.obtained}/${summary.maxTotal}` : '—'}
          </Text>
          <View style={styles.cellCenter}>{summary?.grade ? <Badge label={summary.grade} tone={gradeTone(summary.grade)} /> : null}</View>
        </View>
      </Card>

      {summary && summary.attempted < report.subjects.length && (
        <Text style={styles.note}>Total counts only the {summary.attempted} subject(s) with marks.</Text>
      )}

      <Button
        title="Share report card (PDF)"
        icon="share-outline"
        onPress={() => share([studentId], `Report-card-${student.studentName}-${ctx.examEventName}`)}
        loading={sharing}
      />
      <Card padded={false}>
        <ListRow
          icon="trending-up-outline"
          title="Full year performance"
          subtitle="Class tests and every exam this session"
          onPress={() => navigation.navigate('StudentPerformance', { studentId, studentName: student.studentName, sessionId: ctx.sessionId })}
        />
      </Card>
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  name: { ...typography.title, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  tableHead: { borderTopWidth: 0, backgroundColor: colors.surfaceMuted },
  headText: { ...typography.small, color: colors.textMuted, textTransform: 'uppercase' },
  cellSubject: { flex: 1, ...typography.body, color: colors.text },
  cell: { width: 76, textAlign: 'center', ...typography.bodyStrong, color: colors.text },
  cellCenter: { width: 60, alignItems: 'center' },
  outOf: { ...typography.caption, color: colors.textMuted, fontWeight: '400' },
  totalRow: { backgroundColor: colors.primarySoft },
  totalText: { fontWeight: '700', color: colors.primaryDark },
  note: { ...typography.caption, color: colors.textMuted },
}));

export default StudentReportCardScreen;
