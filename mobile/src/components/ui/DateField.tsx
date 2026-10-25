import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HIT_SIZE, makeStyles, useTheme } from '../../theme';
import { formatDate, fromISODate, toISODate } from '../../lib/date';
import { Icon } from './Icon';
import { Button } from './Button';

interface DateFieldProps {
  label: string;
  /** YYYY-MM-DD or null */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
  maximumDate?: Date;
}

export const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, placeholder = 'Select date', clearable, maximumDate }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? fromISODate(value) : new Date());

  const show = () => {
    setDraft(value ? fromISODate(value) : new Date());
    setOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={`${label}: ${value ? formatDate(value) : 'not set'}`} style={styles.press}>
          <Icon name="calendar-outline" size={18} color={colors.textSubtle} />
          <Text style={[styles.value, !value && styles.placeholder]}>{value ? formatDate(value) : placeholder}</Text>
        </Pressable>
        {clearable && value && (
          <Pressable onPress={() => onChange(null)} accessibilityRole="button" accessibilityLabel={`Clear ${label}`} hitSlop={10}>
            <Icon name="close-circle" size={18} color={colors.textSubtle} />
          </Pressable>
        )}
      </View>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={draft}
          mode="date"
          maximumDate={maximumDate}
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(toISODate(date));
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close date picker" />
          <View style={styles.sheet}>
            <DateTimePicker value={draft} mode="date" display="inline" maximumDate={maximumDate} onChange={(_, date) => date && setDraft(date)} />
            <Button
              title="Done"
              onPress={() => {
                onChange(toISODate(draft));
                setOpen(false);
              }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  wrap: { gap: spacing.xs },
  label: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  field: {
    minHeight: HIT_SIZE + 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  press: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
  value: { ...typography.body, color: colors.text },
  placeholder: { color: colors.textSubtle },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, padding: spacing.lg, paddingBottom: spacing.xxl, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, gap: spacing.md },
}));
