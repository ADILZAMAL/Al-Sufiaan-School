import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon } from '../../../components/ui';
import { makeStyles, useTheme } from '../../../theme';

/** Present / Absent / Unmarked totals. */
export const AttendanceCounts: React.FC<{ present: number; absent: number; unmarked: number }> = ({ present, absent, unmarked }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const items = [
    { label: 'Present', value: present, color: colors.present },
    { label: 'Absent', value: absent, color: colors.absent },
    ...(unmarked > 0 ? [{ label: 'Unmarked', value: unmarked, color: colors.textMuted }] : []),
  ];
  return (
    <View style={styles.counts} accessible accessibilityLabel={items.map(i => `${i.value} ${i.label}`).join(', ')}>
      {items.map(item => (
        <View key={item.label} style={styles.count}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.countValue}>{item.value}</Text>
          <Text style={styles.countLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

interface SaveBarProps {
  dirtyCount: number;
  saving: boolean;
  canUndo?: boolean;
  onSave: () => void;
  /** Shows an undo button when provided. */
  onUndo?: () => void;
  /** Shown when nothing is pending. */
  savedLabel?: string;
  /** Overrides "Save N changes". */
  saveLabel?: string;
}

/** Sticky footer with the save button; stays out of the way when there's nothing to save. */
export const SaveBar: React.FC<SaveBarProps> = ({ dirtyCount, saving, canUndo, onSave, onUndo, savedLabel, saveLabel }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (dirtyCount === 0 && !savedLabel) return null;

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {dirtyCount > 0 ? (
        <>
          {onUndo && (
            <Pressable
              onPress={onUndo}
              disabled={!canUndo || saving}
              accessibilityRole="button"
              accessibilityLabel="Undo last change"
              style={[styles.undo, (!canUndo || saving) && styles.disabled]}
            >
              <Icon name="arrow-undo" size={20} color={colors.primary} />
            </Pressable>
          )}
          <Button
            title={saveLabel ?? `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}`}
            icon="cloud-upload-outline"
            onPress={onSave}
            loading={saving}
            style={styles.save}
          />
        </>
      ) : (
        <View style={styles.saved}>
          <Icon name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.savedText}>{savedLabel}</Text>
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  counts: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  count: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  countValue: { ...typography.bodyStrong, color: colors.text },
  countLabel: { ...typography.caption, color: colors.textMuted },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  undo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  save: { flex: 1 },
  saved: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 40 },
  savedText: { ...typography.caption, color: colors.textMuted },
}));
