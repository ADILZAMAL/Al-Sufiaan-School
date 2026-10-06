import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AttendanceStatus } from '../../../types';
import { Avatar } from '../../../components/ui';
import { HIT_SIZE, makeStyles, useTheme } from '../../../theme';
import { fullName } from '../../../lib/rollNumber';
import { SheetStudent } from '../useAttendanceSheet';

interface AttendanceRowProps {
  student: SheetStudent;
  status: AttendanceStatus | undefined;
  dirty: boolean;
  failed: boolean;
  editable: boolean;
  onToggle: (id: number) => void;
  onSet: (id: number, status: AttendanceStatus) => void;
}

/** One student: tap the row to flip P/A, or tap P / A directly. */
export const AttendanceRow = memo(({ student, status, dirty, failed, editable, onToggle, onSet }: AttendanceRowProps) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const name = fullName(student);
  const absent = status === AttendanceStatus.ABSENT;
  const present = status === AttendanceStatus.PRESENT;
  const streak = student.consecutiveAbsences ?? 0;
  const statusText = present ? 'present' : absent ? 'absent' : 'not marked';

  return (
    <Pressable
      onPress={() => editable && onToggle(student.id)}
      disabled={!editable}
      accessibilityRole="button"
      accessibilityLabel={`${name}, roll ${student.rollNumber ?? 'none'}, ${statusText}${dirty ? ', not saved' : ''}`}
      accessibilityHint={editable ? 'Double tap to switch between present and absent' : undefined}
      style={({ pressed }) => [styles.row, absent && styles.rowAbsent, failed && styles.rowFailed, pressed && styles.pressed]}
    >
      <Text style={styles.roll}>{student.rollNumber ?? '—'}</Text>
      <Avatar firstName={student.firstName} lastName={student.lastName} photo={student.studentPhoto} size={38} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.metaRow}>
          {streak > 0 && (
            <Text style={styles.streak}>
              Absent {streak} day{streak === 1 ? '' : 's'}
            </Text>
          )}
          {failed ? (
            <Text style={styles.failed}>Not saved</Text>
          ) : dirty ? (
            <Text style={styles.unsaved}>Unsaved</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.toggles} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Pressable
          onPress={() => editable && onSet(student.id, AttendanceStatus.PRESENT)}
          disabled={!editable}
          hitSlop={4}
          style={[styles.pill, present && { backgroundColor: colors.present, borderColor: colors.present }]}
        >
          <Text style={[styles.pillText, present && styles.pillTextOn]}>P</Text>
        </Pressable>
        <Pressable
          onPress={() => editable && onSet(student.id, AttendanceStatus.ABSENT)}
          disabled={!editable}
          hitSlop={4}
          style={[styles.pill, absent && { backgroundColor: colors.absent, borderColor: colors.absent }]}
        >
          <Text style={[styles.pillText, absent && styles.pillTextOn]}>A</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});
AttendanceRow.displayName = 'AttendanceRow';

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  rowAbsent: { backgroundColor: colors.absentSoft, borderLeftColor: colors.absent },
  rowFailed: { borderLeftColor: colors.warning },
  pressed: { opacity: 0.85 },
  roll: { ...typography.caption, fontWeight: '700', color: colors.textMuted, width: 26, textAlign: 'center' },
  info: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.text },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 1 },
  streak: { ...typography.small, color: colors.danger },
  unsaved: { ...typography.small, color: colors.primary },
  failed: { ...typography.small, color: colors.warning, fontWeight: '700' },
  toggles: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    width: HIT_SIZE - 4,
    height: HIT_SIZE - 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  pillText: { ...typography.bodyStrong, color: colors.textMuted },
  pillTextOn: { color: colors.onPrimary },
}));
