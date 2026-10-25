import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { academicApi } from '../api/academics';
import { AcademicExam } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { formatDate } from '../lib/date';
import { usePullToRefresh, useRefetchOnFocus } from '../hooks/useRefresh';
import { Badge, Button, EmptyState, ErrorState, Icon, SegmentedControl, SkeletonList } from '../components/ui';
import { ChaptersTab } from '../features/academics/ChaptersTab';
import { HIT_SIZE, makeStyles, useTheme } from '../theme';

type Tab = 'exams' | 'chapters';

const progressBadge = (exam: AcademicExam) => {
  const p = exam.progress;
  if (!p || p.enrolled === 0) return null;
  if (p.entered >= p.enrolled) return <Badge label="Complete" tone="success" />;
  if (p.entered === 0) return <Badge label="Not started" tone="neutral" />;
  return <Badge label={`${p.entered}/${p.enrolled} entered`} tone="warning" />;
};

/** One subject in one section: its exams (enter marks) and chapters (syllabus). */
const SubjectHomeScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const ctx = useRoute<RouteProp<RootStackParamList, 'SubjectHome'>>().params;
  const [tab, setTab] = useState<Tab>('exams');
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: queryKeys.exams(ctx.subjectId, ctx.sectionId),
    queryFn: () => academicApi.getExams({ subjectId: ctx.subjectId, sectionId: ctx.sectionId, sessionId: ctx.sessionId }),
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);
  useRefetchOnFocus(query.refetch);

  const sections = useMemo(() => {
    const exams = query.data ?? [];
    const byDateDesc = (a: AcademicExam, b: AcademicExam) => (b.examDate ?? '').localeCompare(a.examDate ?? '') || b.id - a.id;
    return [
      { key: 'tests', title: 'Class tests', data: exams.filter(e => !e.examEventId).sort(byDateDesc) },
      { key: 'events', title: 'Exams', data: exams.filter(e => !!e.examEventId).sort(byDateDesc) },
    ].filter(s => s.data.length > 0);
  }, [query.data]);

  const openMarks = (exam: AcademicExam) =>
    navigation.navigate('MarksEntry', {
      ...ctx,
      examId: exam.id,
      examName: exam.name,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
    });

  const tabs = (
    <View style={styles.tabs}>
      <SegmentedControl
        options={[
          { value: 'exams', label: 'Exams & marks' },
          { value: 'chapters', label: 'Chapters' },
        ]}
        value={tab}
        onChange={setTab}
      />
    </View>
  );

  if (tab === 'chapters') return <ChaptersTab subjectId={ctx.subjectId} header={tabs} />;

  if (query.isPending) {
    return (
      <View style={styles.root}>
        {tabs}
        <SkeletonList rows={4} />
      </View>
    );
  }
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  return (
    <View style={styles.root}>
      <SectionList
        sections={sections}
        keyExtractor={e => String(e.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={tabs}
        renderSectionHeader={({ section }) => <Text style={styles.groupTitle}>{section.title}</Text>}
        ListEmptyComponent={
          <EmptyState
            icon="create-outline"
            title="No exams yet"
            message="Create a class test to start entering marks."
            actionLabel="New class test"
            onAction={() => navigation.navigate('ClassTestForm', ctx)}
          />
        }
        renderItem={({ item }) => {
          const chapters = item.examChapters?.map(ec => ec.chapter.name) ?? [];
          const editable = !item.examEventId && item.sectionId === ctx.sectionId;
          return (
            <Pressable
              onPress={() => openMarks(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, out of ${item.totalMarks}. Enter marks`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {progressBadge(item)}
                </View>
                <Text style={styles.meta}>
                  Out of {item.totalMarks} · pass {item.passingMarks}
                  {item.examDate ? ` · ${formatDate(item.examDate)}` : ''}
                  {!item.examEventId && item.sectionId == null ? ' · whole class' : ''}
                </Text>
                {chapters.length > 0 && (
                  <Text style={styles.chapters} numberOfLines={1}>
                    {chapters.join(' · ')}
                  </Text>
                )}
              </View>
              {editable && (
                <Pressable
                  onPress={() => navigation.navigate('ClassTestForm', { ...ctx, exam: item })}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                  hitSlop={6}
                  style={styles.edit}
                >
                  <Icon name="create-outline" size={20} color={colors.primary} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
      {sections.length > 0 && (
        <View style={[styles.footer, { bottom: insets.bottom + 16 }]}>
          <Button title="New class test" icon="add" onPress={() => navigation.navigate('ClassTestForm', ctx)} />
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius, shadow }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: { padding: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingBottom: 96, flexGrow: 1 },
  groupTitle: {
    ...typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  pressed: { opacity: 0.9 },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  cardTitle: { ...typography.heading, color: colors.text, flexShrink: 1 },
  meta: { ...typography.caption, color: colors.textMuted },
  chapters: { ...typography.small, color: colors.textSubtle },
  edit: { width: HIT_SIZE, height: HIT_SIZE, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  footer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
}));

export default SubjectHomeScreen;
