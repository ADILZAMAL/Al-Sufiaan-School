import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import dayjs from 'dayjs';
import { HIT_SIZE, makeStyles } from '../../../theme';
import { editableAttendanceDates } from '../../../lib/attendance';
import { formatRelativeDay, isSundayISO, todayISO, addDaysISO } from '../../../lib/date';

interface DayChipsProps {
  value: string;
  onChange: (date: string) => void;
}

/** Today and the previous 7 days — the dates a teacher may mark. */
export const DayChips: React.FC<DayChipsProps> = ({ value, onChange }) => {
  const styles = useStyles();
  const dates = editableAttendanceDates();
  const yesterday = addDaysISO(todayISO(), -1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {dates.map(date => {
        const selected = date === value;
        const sunday = isSundayISO(date);
        const label = date === todayISO() || date === yesterday ? formatRelativeDay(date) : dayjs(date).format('ddd D');
        return (
          <Pressable
            key={date}
            onPress={() => onChange(date)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${dayjs(date).format('dddd, D MMMM')}${sunday ? ', Sunday holiday' : ''}`}
            style={[styles.chip, selected && styles.chipSelected, sunday && !selected && styles.chipMuted]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const useStyles = makeStyles(({ colors, spacing, radius, typography }) => ({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chip: {
    minHeight: HIT_SIZE - 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipMuted: { opacity: 0.5 },
  label: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  labelSelected: { color: colors.onPrimary },
}));
