import React, { useLayoutEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { academicApi } from '../api/academics';
import { ClassTestInput } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage, getStatus } from '../lib/errors';
import { todayISO } from '../lib/date';
import { toast } from '../lib/feedback';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { Button, Card, Icon, Screen, SectionHeader, TextField } from '../components/ui';
import { DateField } from '../components/ui/DateField';
import { makeStyles, useTheme } from '../theme';

/** Create or edit a class test for one subject in one section. */
const ClassTestFormScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const queryClient = useQueryClient();
  const { exam, ...ctx } = useRoute<RouteProp<RootStackParamList, 'ClassTestForm'>>().params;
  const isEdit = !!exam;
  const totalRef = useRef<TextInput>(null);
  const passingRef = useRef<TextInput>(null);

  const initial = {
    name: exam?.name ?? '',
    total: exam ? String(exam.totalMarks) : '',
    passing: exam ? String(exam.passingMarks) : '',
    date: exam ? exam.examDate : todayISO(),
    chapterIds: exam?.examChapters?.map(ec => ec.chapterId) ?? [],
  };
  const [name, setName] = useState(initial.name);
  const [total, setTotal] = useState(initial.total);
  const [passing, setPassing] = useState(initial.passing);
  const [date, setDate] = useState<string | null>(initial.date);
  const [chapterIds, setChapterIds] = useState<number[]>(initial.chapterIds);
  const [submitted, setSubmitted] = useState(false);

  const chaptersQuery = useQuery({
    queryKey: queryKeys.chapters(ctx.subjectId),
    queryFn: () => academicApi.getChapters(ctx.subjectId),
  });

  // Validation
  const totalNum = Number(total);
  const passingNum = Number(passing);
  const errors = {
    name: !name.trim() ? 'Give the test a name' : name.trim().length > 100 ? 'Keep it under 100 characters' : null,
    total: !/^\d+$/.test(total) || totalNum < 1 || totalNum > 1000 ? 'Whole number from 1 to 1000' : null,
    passing: !/^\d+$/.test(passing)
      ? 'Whole number'
      : passingNum > totalNum
        ? 'Can’t be more than total marks'
        : null,
  };
  const valid = !errors.name && !errors.total && !errors.passing;
  const dirty =
    name !== initial.name ||
    total !== initial.total ||
    passing !== initial.passing ||
    date !== initial.date ||
    chapterIds.join() !== initial.chapterIds.join();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.exams(ctx.subjectId, ctx.sectionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.myAssignments });
  };

  const saveMutation = useMutation({
    mutationFn: (input: ClassTestInput) =>
      isEdit
        ? academicApi.updateClassTest(exam!.id, input)
        : academicApi.createClassTest({ ...input, subjectId: ctx.subjectId, sectionId: ctx.sectionId }),
    onSuccess: () => {
      invalidate();
      toast.success(isEdit ? 'Class test updated' : 'Class test created', isEdit ? undefined : 'You can enter marks now.');
      navigation.goBack();
    },
    onError: error => toast.error("Couldn't save the test", getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (force: boolean) => academicApi.deleteClassTest(exam!.id, force),
    onSuccess: () => {
      invalidate();
      toast.success('Class test deleted');
      navigation.goBack();
    },
  });

  useUnsavedChangesGuard(
    dirty && !saveMutation.isPending && !saveMutation.isSuccess && !deleteMutation.isPending && !deleteMutation.isSuccess
  );

  const handleSave = () => {
    setSubmitted(true);
    if (!valid) return;
    saveMutation.mutate({ name: name.trim(), totalMarks: totalNum, passingMarks: passingNum, examDate: date, chapterIds });
  };

  const handleDelete = () => {
    const attempt = (force: boolean) =>
      deleteMutation.mutate(force, {
        onError: error => {
          if (getStatus(error) === 409) {
            Alert.alert('Marks will be deleted', `${getErrorMessage(error)} This can't be undone.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete test & marks', style: 'destructive', onPress: () => attempt(true) },
            ]);
          } else {
            toast.error("Couldn't delete the test", getErrorMessage(error));
          }
        },
      });
    Alert.alert('Delete class test?', `"${exam!.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => attempt(false) },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit class test' : 'New class test',
      headerRight: isEdit
        ? () => (
            <Pressable onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete class test" hitSlop={10} style={{ paddingHorizontal: 16 }}>
              <Icon name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          )
        : undefined,
    });
  });

  const toggleChapter = (id: number) =>
    setChapterIds(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));

  const chapters = chaptersQuery.data ?? [];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
      <Screen>
        <Text style={styles.context}>
          {ctx.subjectName} · Class {ctx.className} – {ctx.sectionName}
        </Text>
        <Card style={styles.card}>
          <TextField
            label="Test name"
            placeholder="e.g. Class Test 3"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            onSubmitEditing={() => totalRef.current?.focus()}
            error={submitted ? errors.name : null}
            maxLength={100}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                ref={totalRef}
                label="Total marks"
                placeholder="e.g. 25"
                value={total}
                onChangeText={t => setTotal(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => passingRef.current?.focus()}
                error={(submitted || total) && errors.total ? errors.total : null}
                maxLength={4}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                ref={passingRef}
                label="Passing marks"
                placeholder={totalNum > 0 ? `e.g. ${Math.ceil(totalNum * 0.33)}` : 'e.g. 9'}
                value={passing}
                onChangeText={t => setPassing(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                error={(submitted || passing) && errors.passing ? errors.passing : null}
                maxLength={4}
              />
            </View>
          </View>
          <DateField label="Test date" value={date} onChange={setDate} clearable placeholder="No date" />
        </Card>

        <SectionHeader title={`Chapters covered${chapterIds.length ? ` (${chapterIds.length})` : ''}`} />
        {chapters.length === 0 ? (
          <Text style={styles.muted}>{chaptersQuery.isPending ? 'Loading chapters…' : 'No chapters added for this subject.'}</Text>
        ) : (
          <Card padded={false} style={styles.chapterList}>
            {chapters.map((chapter, i) => {
              const checked = chapterIds.includes(chapter.id);
              return (
                <Pressable
                  key={chapter.id}
                  onPress={() => toggleChapter(chapter.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={`Chapter ${chapter.orderNumber}, ${chapter.name}`}
                  style={[styles.chapterRow, i > 0 && styles.chapterDivider]}
                >
                  <Icon name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? colors.primary : colors.textSubtle} />
                  <Text style={styles.chapterText}>
                    {chapter.orderNumber}. {chapter.name}
                  </Text>
                  {chapter.isTaught && <Text style={styles.taught}>Taught</Text>}
                </Pressable>
              );
            })}
          </Card>
        )}

        <Button
          title={isEdit ? 'Save changes' : 'Create class test'}
          icon="checkmark"
          onPress={handleSave}
          loading={saveMutation.isPending}
          disabled={deleteMutation.isPending || (isEdit && !dirty)}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  flex: { flex: 1 },
  context: { ...typography.caption, color: colors.textMuted, marginBottom: -spacing.sm },
  card: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  muted: { ...typography.body, color: colors.textMuted },
  chapterList: { overflow: 'hidden' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 48 },
  chapterDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  chapterText: { ...typography.body, color: colors.text, flex: 1 },
  taught: { ...typography.small, color: colors.success },
}));

export default ClassTestFormScreen;
