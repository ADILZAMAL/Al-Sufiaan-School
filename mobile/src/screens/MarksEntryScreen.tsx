import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { academicApi } from '../api/academics';
import { useCurrentUser } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import { drafts } from '../lib/drafts';
import { getErrorMessage } from '../lib/errors';
import { haptics, toast } from '../lib/feedback';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { ErrorState, Icon, SkeletonList } from '../components/ui';
import { SaveBar } from '../features/attendance/components/SheetChrome';
import {
  computeStats,
  markError,
  MarkEntry,
  MarkStudent,
  parseMark,
  rosterToEntries,
  rosterToStudents,
  sameEntry,
} from '../features/marks/marks';
import { HIT_SIZE, makeStyles, useTheme } from '../theme';

const ACCESSORY_ID = 'marks-entry-nav';
type Entries = Record<number, MarkEntry>;

interface MarkRowProps {
  student: MarkStudent;
  index: number;
  entry: MarkEntry;
  error: string | null;
  dirty: boolean;
  totalMarks: number;
  passingMarks: number;
  isLast: boolean;
  inputRef: (index: number, ref: TextInput | null) => void;
  onChange: (studentId: number, value: string) => void;
  onToggleAbsent: (studentId: number) => void;
  onFocusRow: (index: number) => void;
  onNext: (index: number) => void;
  onLayoutRow: (index: number, y: number) => void;
}

const MarkRow = memo(
  ({ student, index, entry, error, dirty, totalMarks, passingMarks, isLast, inputRef, onChange, onToggleAbsent, onFocusRow, onNext, onLayoutRow }: MarkRowProps) => {
    const styles = useStyles();
    const { colors } = useTheme();
    const n = parseMark(entry.value);
    const tone = error ? colors.danger : n === null || Number.isNaN(n) ? colors.border : n >= passingMarks ? colors.success : colors.warning;

    return (
      <View style={[styles.row, entry.absent && styles.rowAbsent]} onLayout={e => onLayoutRow(index, e.nativeEvent.layout.y)}>
        <Text style={styles.roll}>{student.rollNumber ?? '—'}</Text>
        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {student.name}
          </Text>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : dirty ? (
            <Text style={styles.unsaved}>Unsaved</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => onToggleAbsent(student.studentId)}
          accessibilityRole="switch"
          accessibilityState={{ checked: entry.absent }}
          accessibilityLabel={`${student.name} absent`}
          style={[styles.absent, entry.absent && styles.absentOn]}
        >
          <Text style={[styles.absentText, entry.absent && styles.absentTextOn]}>AB</Text>
        </Pressable>
        {entry.absent ? (
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.absentDash}>—</Text>
          </View>
        ) : (
          <TextInput
            ref={r => inputRef(index, r)}
            value={entry.value}
            onChangeText={t => onChange(student.studentId, t)}
            onFocus={() => onFocusRow(index)}
            keyboardType="decimal-pad"
            returnKeyType={isLast ? 'done' : 'next'}
            onSubmitEditing={() => onNext(index)}
            blurOnSubmit={isLast}
            inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
            placeholder={`/${totalMarks}`}
            placeholderTextColor={colors.textSubtle}
            maxLength={6}
            selectTextOnFocus
            accessibilityLabel={`Marks for ${student.name}, out of ${totalMarks}`}
            style={[styles.input, { borderColor: tone }]}
          />
        )}
      </View>
    );
  }
);
MarkRow.displayName = 'MarkRow';

/** Enter or update marks for one exam in one section. */
const MarksEntryScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();
  const user = useCurrentUser();
  const ctx = useRoute<RouteProp<RootStackParamList, 'MarksEntry'>>().params;
  const { examId, sectionId, sessionId, totalMarks, passingMarks } = ctx;
  const draftKey = `marks:${user.userId}:${examId}:${sectionId}`;

  const query = useQuery({
    queryKey: queryKeys.marks(examId, sectionId),
    queryFn: () => academicApi.getMarksRoster(examId, sectionId, sessionId),
  });
  const students = useMemo(() => rosterToStudents(query.data ?? []), [query.data]);

  const [entries, setEntries] = useState<Entries>({});
  const [baseline, setBaseline] = useState<Entries>({});
  const [touched, setTouched] = useState(false);
  const initialized = useRef(false);
  const draftResolved = useRef(false);

  // Initialise from the server once, then offer any unsaved draft back
  useEffect(() => {
    if (!query.data || initialized.current) return;
    initialized.current = true;
    const saved = rosterToEntries(query.data);
    setBaseline(saved);
    setEntries(saved);

    drafts.load<Entries>(draftKey).then(draft => {
      const changes = Object.entries(draft?.data ?? {})
        .map(([id, e]) => [Number(id), e] as const)
        .filter(([id, e]) => saved[id] && !sameEntry(saved[id], e));
      if (!draft || changes.length === 0) {
        draftResolved.current = true;
        return;
      }
      Alert.alert(
        'Restore unsaved marks?',
        `${changes.length} mark${changes.length === 1 ? '' : 's'} from ${dayjs(draft.savedAt).format('h:mm A, D MMM')} weren't saved.`,
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              drafts.remove(draftKey);
              draftResolved.current = true;
            },
          },
          {
            text: 'Restore',
            onPress: () => {
              setEntries(prev => ({ ...prev, ...Object.fromEntries(changes) }));
              setTouched(true);
              draftResolved.current = true;
            },
          },
        ],
        { cancelable: false }
      );
    });
  }, [query.data, draftKey]);

  const dirtyIds = useMemo(
    () => students.map(s => s.studentId).filter(id => !sameEntry(entries[id], baseline[id])),
    [students, entries, baseline]
  );
  const errors = useMemo(() => {
    const map: Record<number, string | null> = {};
    students.forEach(s => {
      map[s.studentId] = markError(entries[s.studentId], totalMarks);
    });
    return map;
  }, [students, entries, totalMarks]);
  const stats = useMemo(() => computeStats(students, entries, passingMarks), [students, entries, passingMarks]);

  // Autosave unsaved marks as a draft
  useEffect(() => {
    if (!draftResolved.current) return;
    const timer = setTimeout(() => {
      if (dirtyIds.length > 0) drafts.save(draftKey, entries);
      else drafts.remove(draftKey);
    }, 500);
    return () => clearTimeout(timer);
  }, [entries, dirtyIds.length, draftKey]);

  // ── Focus & scrolling ──
  const scrollRef = useRef<ScrollView>(null);
  const inputs = useRef<(TextInput | null)[]>([]);
  const rowY = useRef<number[]>([]);
  const [focused, setFocused] = useState<number | null>(null);

  const setInputRef = useCallback((index: number, ref: TextInput | null) => {
    inputs.current[index] = ref;
  }, []);
  const onLayoutRow = useCallback((index: number, y: number) => {
    rowY.current[index] = y;
  }, []);
  const onFocusRow = useCallback((index: number) => {
    setFocused(index);
    scrollRef.current?.scrollTo({ y: Math.max(0, (rowY.current[index] ?? 0) - 120), animated: true });
  }, []);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const studentsRef = useRef(students);
  studentsRef.current = students;

  /** Focus the next/previous student who isn't marked absent. */
  const focusFrom = useCallback((index: number, step: 1 | -1) => {
    const list = studentsRef.current;
    for (let i = index + step; i >= 0 && i < list.length; i += step) {
      if (!entriesRef.current[list[i].studentId]?.absent) {
        inputs.current[i]?.focus();
        return;
      }
    }
    Keyboard.dismiss();
  }, []);
  const onNext = useCallback((index: number) => focusFrom(index, 1), [focusFrom]);

  // ── Editing ──
  const onChange = useCallback((studentId: number, text: string) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setTouched(true);
    setEntries(prev => ({ ...prev, [studentId]: { absent: false, value: cleaned } }));
  }, []);
  const onToggleAbsent = useCallback((studentId: number) => {
    haptics.tap();
    setTouched(true);
    setEntries(prev => {
      const current = prev[studentId] ?? { value: '', absent: false };
      return { ...prev, [studentId]: { absent: !current.absent, value: current.absent ? current.value : '' } };
    });
  }, []);

  // ── Saving ──
  const mutation = useMutation({
    mutationFn: (rows: { studentId: number; marksObtained: number | null; isAbsent: boolean }[]) =>
      academicApi.bulkSubmitMarks(examId, rows, sectionId),
  });

  const handleSave = async () => {
    const invalid = dirtyIds.filter(id => errors[id]);
    if (invalid.length > 0) {
      haptics.error();
      toast.error(`Fix ${invalid.length} mark${invalid.length === 1 ? '' : 's'} first`, `Marks must be between 0 and ${totalMarks}.`);
      const index = students.findIndex(s => s.studentId === invalid[0]);
      inputs.current[index]?.focus();
      return;
    }
    Keyboard.dismiss();
    const ids = dirtyIds;
    const snapshot = entries;
    try {
      await mutation.mutateAsync(
        ids.map(id => ({
          studentId: id,
          isAbsent: snapshot[id].absent,
          marksObtained: snapshot[id].absent ? null : parseMark(snapshot[id].value),
        }))
      );
      setBaseline(prev => ({ ...prev, ...Object.fromEntries(ids.map(id => [id, snapshot[id]])) }));
      setTouched(false);
      await drafts.remove(draftKey);
      queryClient.invalidateQueries({ queryKey: ['academic', 'exams', ctx.subjectId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.myAssignments });
      haptics.success();
      toast.success('Marks saved', `${stats.entered} of ${stats.total} students entered`);
    } catch (error) {
      haptics.error();
      toast.error("Couldn't save marks", `${getErrorMessage(error)} Your marks are kept on this phone.`);
    }
  };

  useUnsavedChangesGuard(touched && dirtyIds.length > 0 && !mutation.isPending, {
    message: `${dirtyIds.length} mark${dirtyIds.length === 1 ? '' : 's'} haven't been saved. They're kept as a draft on this phone.`,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('ExamResults', ctx)}
          accessibilityRole="button"
          accessibilityLabel="View results"
          hitSlop={10}
          style={{ paddingHorizontal: 16 }}
        >
          <Icon name="stats-chart-outline" size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, ctx, colors.primary]);

  if (query.isPending) return <SkeletonList rows={8} />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
      <View style={styles.summary} accessible accessibilityLabel={`${stats.entered} of ${stats.total} entered. Average ${stats.average ?? 'none'}.`}>
        <Text style={styles.summaryMeta}>
          Out of {totalMarks} · pass {passingMarks}
        </Text>
        <View style={styles.chips}>
          <Text style={styles.chip}>
            <Text style={styles.chipValue}>{stats.entered}</Text>/{stats.total} entered
          </Text>
          <Text style={styles.chip}>
            Avg <Text style={styles.chipValue}>{stats.average ?? '—'}</Text>
          </Text>
          <Text style={[styles.chip, { color: colors.success }]}>Pass {stats.passed}</Text>
          <Text style={[styles.chip, { color: colors.warning }]}>Fail {stats.failed}</Text>
          <Text style={styles.chip}>AB {stats.absent}</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.flex} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {students.map((student, index) => (
          <MarkRow
            key={student.studentId}
            student={student}
            index={index}
            entry={entries[student.studentId] ?? { value: '', absent: false }}
            error={errors[student.studentId]}
            dirty={!sameEntry(entries[student.studentId], baseline[student.studentId])}
            totalMarks={totalMarks}
            passingMarks={passingMarks}
            isLast={index === students.length - 1}
            inputRef={setInputRef}
            onChange={onChange}
            onToggleAbsent={onToggleAbsent}
            onFocusRow={onFocusRow}
            onNext={onNext}
            onLayoutRow={onLayoutRow}
          />
        ))}
        {students.length === 0 && <Text style={styles.empty}>No active students are enrolled in this section.</Text>}
      </ScrollView>

      <SaveBar
        dirtyCount={dirtyIds.length}
        saving={mutation.isPending}
        onSave={handleSave}
        saveLabel={dirtyIds.length ? `Save ${dirtyIds.length} mark${dirtyIds.length === 1 ? '' : 's'}` : undefined}
        savedLabel={stats.total > 0 ? (stats.notEntered === 0 ? 'All marks saved' : `${stats.notEntered} student${stats.notEntered === 1 ? '' : 's'} still without marks`) : undefined}
      />

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable onPress={() => focused !== null && focusFrom(focused, -1)} accessibilityRole="button" accessibilityLabel="Previous student" hitSlop={8} style={styles.accessoryButton}>
              <Icon name="chevron-up" size={22} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => focused !== null && focusFrom(focused, 1)} accessibilityRole="button" accessibilityLabel="Next student" hitSlop={8} style={styles.accessoryButton}>
              <Icon name="chevron-down" size={22} color={colors.primary} />
            </Pressable>
            <Text style={styles.accessoryLabel} numberOfLines={1}>
              {focused !== null ? students[focused]?.name : ''}
            </Text>
            <Pressable onPress={() => Keyboard.dismiss()} accessibilityRole="button" hitSlop={8} style={styles.accessoryButton}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </KeyboardAvoidingView>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  summary: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  summaryMeta: { ...typography.caption, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  chip: { ...typography.caption, color: colors.textSecondary },
  chipValue: { fontWeight: '700', color: colors.text },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowAbsent: { backgroundColor: colors.surfaceMuted },
  roll: { ...typography.caption, fontWeight: '700', color: colors.textMuted, width: 26, textAlign: 'center' },
  nameWrap: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.text },
  error: { ...typography.small, color: colors.danger, marginTop: 1 },
  unsaved: { ...typography.small, color: colors.primary, marginTop: 1 },
  absent: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentOn: { backgroundColor: colors.absent, borderColor: colors.absent },
  absentText: { ...typography.small, fontWeight: '700', color: colors.textMuted },
  absentTextOn: { color: colors.onPrimary },
  input: {
    width: 76,
    height: HIT_SIZE,
    borderRadius: radius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    ...typography.heading,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputDisabled: { borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  absentDash: { ...typography.heading, color: colors.textSubtle },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  accessory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    height: 44,
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accessoryButton: { paddingHorizontal: spacing.sm, height: 44, justifyContent: 'center' },
  accessoryLabel: { ...typography.caption, color: colors.textMuted, flex: 1, textAlign: 'center' },
  done: { ...typography.bodyStrong, color: colors.primary },
}));

export default MarksEntryScreen;
