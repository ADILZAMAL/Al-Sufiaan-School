import React from 'react';
import { Pressable, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { makeStyles, useTheme } from '../theme';
import { Icon } from './ui';

export type DayTone = 'success' | 'warning' | 'danger' | 'holiday' | 'missing' | 'future' | 'plain';

export interface DayCell {
  tone: DayTone;
  /** Screen-reader description, e.g. "25 September, 92% present". */
  accessibilityLabel: string;
  onPress?: () => void;
}

interface MonthCalendarProps {
  /** YYYY-MM */
  month: string;
  renderDay: (date: string) => DayCell;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ month, renderDay }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const first = dayjs(`${month}-01`);
  const offset = first.day();
  const days = first.daysInMonth();
  const today = dayjs().format('YYYY-MM-DD');

  const toneStyle: Record<DayTone, { bg: string; fg: string; border?: string }> = {
    success: { bg: colors.presentSoft, fg: colors.present },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.absentSoft, fg: colors.absent },
    holiday: { bg: colors.holidaySoft, fg: colors.textSubtle },
    missing: { bg: colors.surface, fg: colors.danger, border: colors.danger },
    future: { bg: 'transparent', fg: colors.textSubtle },
    plain: { bg: colors.surface, fg: colors.text },
  };

  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => first.date(i + 1).format('YYYY-MM-DD')),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <View style={styles.root}>
      <View style={styles.week}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday} importantForAccessibility="no">
            {d}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.week}>
          {cells.slice(row * 7, row * 7 + 7).map((date, i) => {
            if (!date) return <View key={`e${i}`} style={styles.cell} />;
            const cell = renderDay(date);
            const tone = toneStyle[cell.tone];
            const isToday = date === today;
            return (
              <Pressable
                key={date}
                onPress={cell.onPress}
                disabled={!cell.onPress}
                accessibilityRole={cell.onPress ? 'button' : 'text'}
                accessibilityLabel={cell.accessibilityLabel}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.day,
                    { backgroundColor: tone.bg },
                    tone.border ? { borderWidth: 1.5, borderColor: tone.border, borderStyle: 'dashed' } : null,
                    isToday && styles.today,
                  ]}
                >
                  <Text style={[styles.dayText, { color: tone.fg }, isToday && styles.todayText]}>{dayjs(date).date()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
  /** YYYY-MM; months after this are disabled. */
  max?: string;
  min?: string;
}

export const MonthSwitcher: React.FC<MonthSwitcherProps> = ({ month, onChange, max, min }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const prev = dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM');
  const next = dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM');
  const canPrev = !min || prev >= min;
  const canNext = !max || next <= max;

  return (
    <View style={styles.switcher}>
      <Pressable
        onPress={() => canPrev && onChange(prev)}
        disabled={!canPrev}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={10}
        style={[styles.arrow, !canPrev && styles.disabled]}
      >
        <Icon name="chevron-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.monthLabel} accessibilityRole="header">
        {dayjs(`${month}-01`).format('MMMM YYYY')}
      </Text>
      <Pressable
        onPress={() => canNext && onChange(next)}
        disabled={!canNext}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={10}
        style={[styles.arrow, !canNext && styles.disabled]}
      >
        <Icon name="chevron-forward" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
};

export const CalendarLegend: React.FC<{ items: { tone: DayTone; label: string }[] }> = ({ items }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const swatch: Record<DayTone, string> = {
    success: colors.present,
    warning: colors.warning,
    danger: colors.absent,
    holiday: colors.border,
    missing: colors.danger,
    future: colors.textSubtle,
    plain: colors.border,
  };
  return (
    <View style={styles.legend}>
      {items.map(item => (
        <View key={item.label} style={styles.legendItem}>
          <View
            style={[
              styles.legendSwatch,
              item.tone === 'missing'
                ? { borderWidth: 1.5, borderColor: swatch.missing, borderStyle: 'dashed' }
                : { backgroundColor: swatch[item.tone] },
            ]}
          />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  root: { gap: 2 },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', ...typography.small, color: colors.textMuted, paddingVertical: spacing.xs },
  cell: { flex: 1, aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  dayText: { ...typography.caption, fontWeight: '600' },
  today: { borderWidth: 2, borderColor: colors.primary },
  todayText: { fontWeight: '800' },
  switcher: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { padding: spacing.sm },
  disabled: { opacity: 0.3 },
  monthLabel: { ...typography.heading, color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { ...typography.small, color: colors.textMuted },
}));
