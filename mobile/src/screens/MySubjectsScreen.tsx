import React, { useMemo } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useMyAssignments } from '../hooks/queries';
import { usePullToRefresh } from '../hooks/useRefresh';
import { SubjectContext, useRootNavigation } from '../navigation/types';
import { Badge, EmptyState, ErrorState, ListRow, SkeletonList } from '../components/ui';
import { makeStyles } from '../theme';
import { getErrorMessage } from '../lib/errors';
import { MyAssignment } from '../types';

const subtitleFor = (a: MyAssignment) => {
  const p = a.progress;
  if (!p) return 'Exams, marks & chapters';
  if (p.examCount === 0) return 'No exams yet';
  const tests = `${p.classTestCount} class test${p.classTestCount === 1 ? '' : 's'}`;
  return p.pendingExamCount ? `${tests} · marks pending` : `${tests} · all marks entered`;
};

/** Academics tab: every subject the teacher teaches, grouped by class & section. */
const MySubjectsScreen: React.FC = () => {
  const styles = useStyles();
  const navigation = useRootNavigation();
  const query = useMyAssignments();
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);

  const sections = useMemo(() => {
    const groups = new Map<string, { title: string; data: MyAssignment[] }>();
    for (const a of query.data?.assignments ?? []) {
      const key = `${a.class.id}-${a.section.id}`;
      if (!groups.has(key)) groups.set(key, { title: `Class ${a.class.name} – ${a.section.name}`, data: [] });
      groups.get(key)!.data.push(a);
    }
    return Array.from(groups.values());
  }, [query.data]);

  const toContext = (a: MyAssignment): SubjectContext => ({
    subjectId: a.subject.id,
    subjectName: a.subject.name,
    classId: a.class.id,
    className: a.class.name,
    sectionId: a.section.id,
    sectionName: a.section.name,
    sessionId: a.sessionId,
  });

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  return (
    <SectionList
      style={styles.root}
      contentContainerStyle={styles.list}
      sections={sections}
      keyExtractor={a => String(a.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          {query.data?.session && <Text style={styles.session}>Session {query.data.session.name}</Text>}
          {sections.length > 0 && (
            <View style={styles.reportCard}>
              <ListRow
                icon="ribbon-outline"
                title="Report cards"
                subtitle="Exam results, grades & ranks for your sections"
                onPress={() => navigation.navigate('ReportCardPicker')}
              />
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="book-outline"
          title="No subjects assigned"
          message="Ask the school office to assign your subjects for this session. They'll appear here."
          actionLabel="Refresh"
          onAction={onRefresh}
        />
      }
      renderSectionHeader={({ section }) => <Text style={styles.groupTitle}>{section.title}</Text>}
      renderItem={({ item, index, section }) => {
        const ctx = toContext(item);
        const first = index === 0;
        const last = index === section.data.length - 1;
        return (
          <View style={[styles.rowWrap, first && styles.rowFirst, last && styles.rowLast]}>
            <ListRow
              icon="book-outline"
              title={item.subject.name}
              subtitle={subtitleFor(item)}
              onPress={() => navigation.navigate('SubjectHome', ctx)}
              accessibilityHint="Opens exams, marks and chapters"
              right={
                item.progress?.pendingExamCount ? (
                  <Badge label={`${item.progress.pendingExamCount} to mark`} tone="warning" />
                ) : undefined
              }
            />
            {!last && <View style={styles.divider} />}
          </View>
        );
      }}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, radius, typography }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  session: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  groupTitle: {
    ...typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowWrap: { backgroundColor: colors.surface, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg + 38 + spacing.md },
  reportCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.xs },
}));

export default MySubjectsScreen;
