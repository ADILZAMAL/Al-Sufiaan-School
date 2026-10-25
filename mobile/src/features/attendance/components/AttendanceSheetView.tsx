import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, Text, View } from 'react-native';
import { AttendanceStatus } from '../../../types';
import { EmptyState, Icon, SegmentedControl, TextField } from '../../../components/ui';
import { makeStyles, useTheme } from '../../../theme';
import { formatLongDate } from '../../../lib/date';
import { getErrorMessage } from '../../../lib/errors';
import { haptics, toast } from '../../../lib/feedback';
import { fullName } from '../../../lib/rollNumber';
import { useUnsavedChangesGuard } from '../../../hooks/useUnsavedChangesGuard';
import { SheetStudent, useAttendanceSheet } from '../useAttendanceSheet';
import { AttendanceRow } from './AttendanceRow';
import { AttendanceCardMode } from './AttendanceCardMode';
import { DayChips } from './DayChips';
import { AttendanceCounts, SaveBar } from './SheetChrome';

type Sheet = ReturnType<typeof useAttendanceSheet>;
type Filter = 'all' | 'absent' | 'unmarked';

interface AttendanceSheetViewProps {
  students: SheetStudent[];
  sheet: Sheet;
  date: string;
  editable: boolean;
  /** Offer the date chips (today … 7 days ago). */
  onDateChange?: (date: string) => void;
  holidayName?: string | null;
  /** Group rows by `student.group` (boarding lists). */
  grouped?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const AttendanceSheetView: React.FC<AttendanceSheetViewProps> = ({
  students,
  sheet,
  date,
  editable,
  onDateChange,
  holidayName,
  grouped = false,
  refreshing = false,
  onRefresh,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [mode, setMode] = useState<'list' | 'cards'>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useUnsavedChangesGuard(sheet.hasUserEdits && !sheet.saving, {
    message: `${sheet.dirtyCount} attendance change${sheet.dirtyCount === 1 ? '' : 's'} haven't been saved. They're kept as a draft on this phone.`,
  });

  const changeDate = (next: string) => {
    if (!onDateChange || next === date) return;
    if (!sheet.hasUserEdits) return onDateChange(next);
    Alert.alert('Unsaved changes', 'Switch date without saving? Your changes stay as a draft for this date.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Switch', onPress: () => onDateChange(next) },
    ]);
  };

  const onToggle = useCallback(
    (id: number) => {
      haptics.tap();
      sheet.toggle(id);
    },
    [sheet.toggle]
  );
  const onSet = useCallback(
    (id: number, status: AttendanceStatus) => {
      haptics.tap();
      sheet.setStatus(id, status);
    },
    [sheet.setStatus]
  );

  const handleSave = async () => {
    try {
      const { saved, failed } = await sheet.save();
      if (failed > 0) {
        haptics.warning();
        toast.error(`${failed} student${failed === 1 ? '' : 's'} not saved`, 'They are highlighted — tap Save to retry.');
      } else {
        haptics.success();
        toast.success(`Attendance saved`, `${saved} student${saved === 1 ? '' : 's'} · ${formatLongDate(date)}`);
      }
    } catch (error) {
      haptics.error();
      toast.error("Couldn't save attendance", `${getErrorMessage(error)} Your changes are kept on this phone.`);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => {
      const status = sheet.marks[s.id];
      if (filter === 'absent' && status !== AttendanceStatus.ABSENT) return false;
      if (filter === 'unmarked' && status) return false;
      if (q && !fullName(s).toLowerCase().includes(q) && s.rollNumber?.toLowerCase() !== q) return false;
      return true;
    });
  }, [students, sheet.marks, filter, search]);

  const sections = useMemo(() => {
    if (!grouped) return [{ title: '', data: visible }];
    const groups = new Map<string, SheetStudent[]>();
    visible.forEach(s => {
      const key = s.group ?? 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    });
    return Array.from(groups, ([title, data]) => ({ title, data }));
  }, [visible, grouped]);

  const header = (
    <View style={styles.header}>
      {onDateChange && editable && <DayChips value={date} onChange={changeDate} />}
      {!editable && (
        <View style={styles.lockBanner}>
          <Icon name="lock-closed-outline" size={16} color={colors.textMuted} />
          <Text style={styles.lockText}>
            {formatLongDate(date)} is view-only — attendance can be changed for the last 7 days.
          </Text>
        </View>
      )}
      {!holidayName && students.length > 0 && (
        <>
          {editable && Object.keys(sheet.baseline).length === 0 && (
            <View style={styles.hint}>
              <Icon name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.hintText}>Not marked yet — everyone starts as present. Tap the absentees, then save.</Text>
            </View>
          )}
          <AttendanceCounts {...sheet.counts} />
          <View style={styles.controls}>
            <View style={styles.modeSwitch}>
              <SegmentedControl
                options={[
                  { value: 'list', label: 'List' },
                  { value: 'cards', label: 'One by one' },
                ]}
                value={mode}
                onChange={setMode}
              />
            </View>
          </View>
          {mode === 'list' && (
            <View style={styles.filters}>
              {(['all', 'absent', ...(sheet.counts.unmarked > 0 ? ['unmarked'] : [])] as Filter[]).map(f => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === f }}
                  style={[styles.filterChip, filter === f && styles.filterChipOn]}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>
                    {f === 'all' ? `All ${students.length}` : f === 'absent' ? `Absent ${sheet.counts.absent}` : `Unmarked ${sheet.counts.unmarked}`}
                  </Text>
                </Pressable>
              ))}
              <View style={styles.flex} />
              {editable && (
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    sheet.markAll(AttendanceStatus.PRESENT);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Mark everyone present"
                  style={styles.allPresent}
                >
                  <Icon name="checkmark-done" size={16} color={colors.present} />
                  <Text style={styles.allPresentText}>All present</Text>
                </Pressable>
              )}
            </View>
          )}
          {mode === 'list' && students.length > 30 && (
            <View style={styles.search}>
              <TextField icon="search" placeholder="Search name or roll" value={search} onChangeText={setSearch} autoCorrect={false} />
            </View>
          )}
        </>
      )}
    </View>
  );

  if (holidayName) {
    return (
      <View style={styles.root}>
        {header}
        <EmptyState icon="sunny-outline" title={`Holiday · ${holidayName}`} message={`No attendance on ${formatLongDate(date)}.`} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {mode === 'cards' ? (
        <>
          {header}
          <AttendanceCardMode
            key={date}
            students={students}
            marks={sheet.marks}
            onSet={(id, status) => sheet.setStatus(id, status)}
            onFinish={() => setMode('list')}
          />
        </>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={s => String(s.id)}
          ListHeaderComponent={header}
          stickySectionHeadersEnabled={grouped}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (grouped ? <Text style={styles.groupTitle}>{section.title}</Text> : null)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon={students.length === 0 ? 'people-outline' : 'funnel-outline'}
              title={students.length === 0 ? 'No students' : 'Nobody here'}
              message={students.length === 0 ? 'No active students are enrolled.' : 'No students match this filter.'}
            />
          }
          renderItem={({ item }) => (
            <AttendanceRow
              student={item}
              status={sheet.marks[item.id]}
              dirty={sheet.baseline[item.id] !== undefined && sheet.isDirty(item.id)}
              failed={sheet.failedIds.has(item.id)}
              editable={editable}
              onToggle={onToggle}
              onSet={onSet}
            />
          )}
        />
      )}
      {editable && (
        <SaveBar
          dirtyCount={sheet.dirtyCount}
          saving={sheet.saving}
          canUndo={sheet.canUndo}
          onSave={handleSave}
          onUndo={sheet.undo}
          saveLabel={Object.keys(sheet.baseline).length === 0 ? 'Save attendance' : undefined}
          savedLabel={sheet.counts.unmarked === 0 && students.length > 0 ? 'All attendance saved' : undefined}
        />
      )}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingBottom: spacing.sm, backgroundColor: colors.background },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  hintText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  controls: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  modeSwitch: {},
  filters: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: { backgroundColor: colors.text, borderColor: colors.text },
  filterText: { ...typography.small, color: colors.textSecondary },
  filterTextOn: { color: colors.surface },
  allPresent: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: spacing.sm },
  allPresentText: { ...typography.small, color: colors.present },
  search: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  listContent: { paddingBottom: spacing.xl, flexGrow: 1 },
  groupTitle: {
    ...typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  separator: { height: 1, backgroundColor: colors.divider },
}));
