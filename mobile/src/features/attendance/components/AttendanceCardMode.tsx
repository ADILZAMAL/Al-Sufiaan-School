import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AttendanceStatus } from '../../../types';
import { Avatar, Button, Icon } from '../../../components/ui';
import { makeStyles, useTheme } from '../../../theme';
import { fullName } from '../../../lib/rollNumber';
import { haptics } from '../../../lib/feedback';
import { SheetStudent } from '../useAttendanceSheet';

interface AttendanceCardModeProps {
  students: SheetStudent[];
  marks: Record<number, AttendanceStatus>;
  onSet: (id: number, status: AttendanceStatus) => void;
  onFinish: () => void;
}

/** One student at a time — handy when calling the register aloud. */
export const AttendanceCardMode: React.FC<AttendanceCardModeProps> = ({ students, marks, onSet, onFinish }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [index, setIndex] = useState(() => {
    const firstUnmarked = students.findIndex(s => !marks[s.id]);
    return firstUnmarked === -1 ? 0 : firstUnmarked;
  });

  if (students.length === 0) return null;

  if (index >= students.length) {
    return (
      <View style={styles.done}>
        <Icon name="checkmark-circle" size={56} color={colors.success} />
        <Text style={styles.doneTitle}>All {students.length} students marked</Text>
        <Text style={styles.doneText}>Review the list, then save.</Text>
        <Button title="Review list" icon="list" onPress={onFinish} style={styles.doneButton} />
        <Button title="Back to last student" variant="ghost" onPress={() => setIndex(students.length - 1)} />
      </View>
    );
  }

  const student = students[index];
  const status = marks[student.id];
  const streak = student.consecutiveAbsences ?? 0;

  const mark = (next: AttendanceStatus) => {
    next === AttendanceStatus.ABSENT ? haptics.warning() : haptics.tap();
    onSet(student.id, next);
    setIndex(i => i + 1);
  };

  return (
    <View style={styles.root}>
      <View style={styles.progressRow}>
        <Pressable
          onPress={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous student"
          hitSlop={10}
          style={[styles.navButton, index === 0 && styles.disabled]}
        >
          <Icon name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.progress} accessibilityLiveRegion="polite">
          {index + 1} of {students.length}
        </Text>
        <Pressable
          onPress={() => setIndex(i => Math.min(students.length, i + 1))}
          accessibilityRole="button"
          accessibilityLabel="Skip to next student"
          hitSlop={10}
          style={styles.navButton}
        >
          <Icon name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(index / students.length) * 100}%` }]} />
      </View>

      <View style={styles.card}>
        <Avatar firstName={student.firstName} lastName={student.lastName} photo={student.studentPhoto} size={112} />
        <Text style={styles.name}>{fullName(student)}</Text>
        <Text style={styles.roll}>Roll {student.rollNumber ?? '—'}</Text>
        {streak > 0 && (
          <Text style={styles.streak}>
            Absent for {streak} day{streak === 1 ? '' : 's'}
          </Text>
        )}
        {status && (
          <Text style={[styles.current, { color: status === AttendanceStatus.PRESENT ? colors.present : colors.absent }]}>
            Currently {status === AttendanceStatus.PRESENT ? 'present' : 'absent'}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => mark(AttendanceStatus.ABSENT)}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${fullName(student)} absent`}
          style={({ pressed }) => [styles.big, { backgroundColor: colors.absent }, pressed && styles.pressed]}
        >
          <Icon name="close" size={30} color={colors.onPrimary} />
          <Text style={styles.bigText}>Absent</Text>
        </Pressable>
        <Pressable
          onPress={() => mark(AttendanceStatus.PRESENT)}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${fullName(student)} present`}
          style={({ pressed }) => [styles.big, { backgroundColor: colors.present }, pressed && styles.pressed]}
        >
          <Icon name="checkmark" size={30} color={colors.onPrimary} />
          <Text style={styles.bigText}>Present</Text>
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  root: { flex: 1, padding: spacing.lg, gap: spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { padding: spacing.sm },
  disabled: { opacity: 0.3 },
  progress: { ...typography.bodyStrong, color: colors.textSecondary },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.primary },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  name: { ...typography.title, color: colors.text, textAlign: 'center', marginTop: spacing.md },
  roll: { ...typography.body, color: colors.textMuted },
  streak: { ...typography.caption, color: colors.danger, fontWeight: '600', marginTop: spacing.xs },
  current: { ...typography.caption, fontWeight: '600', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md },
  big: { flex: 1, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  bigText: { ...typography.heading, color: colors.onPrimary },
  pressed: { opacity: 0.85 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  doneTitle: { ...typography.title, color: colors.text },
  doneText: { ...typography.body, color: colors.textMuted },
  doneButton: { minWidth: 200, marginTop: spacing.md },
}));
