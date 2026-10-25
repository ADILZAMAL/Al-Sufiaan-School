import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { holidayApi } from '../api/holiday';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { eachHolidayDate } from '../lib/holidays';
import { ISO_DATE, isSundayISO } from '../lib/date';
import { usePullToRefresh } from '../hooks/useRefresh';
import { Card, ErrorState, ListRow, Screen, SectionHeader } from '../components/ui';
import { CalendarLegend, DayCell, MonthCalendar, MonthSwitcher } from '../components/MonthCalendar';
import { makeStyles, useTheme } from '../theme';

/** School holidays month by month (Sundays shown as holidays too). */
const HolidayCalendarScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const from = `${month}-01`;
  const to = dayjs(from).endOf('month').format(ISO_DATE);

  const query = useQuery({
    queryKey: queryKeys.holidays(from, to),
    queryFn: () => holidayApi.getHolidays(from, to),
    placeholderData: keepPreviousData,
    meta: { persist: true },
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);

  const byDate = useMemo(() => {
    const map = new Map<string, string>();
    (query.data ?? []).forEach(h => eachHolidayDate(h).forEach(d => map.set(d, h.name)));
    return map;
  }, [query.data]);

  const holidays = useMemo(
    () => (query.data ?? []).filter(h => h.endDate >= from && h.startDate <= to).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [query.data, from, to]
  );

  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  const renderDay = (date: string): DayCell => {
    const label = dayjs(date).format('D MMMM');
    const name = byDate.get(date);
    if (name) return { tone: 'danger', accessibilityLabel: `${label}, ${name}` };
    if (isSundayISO(date)) return { tone: 'holiday', accessibilityLabel: `${label}, Sunday` };
    return { tone: 'plain', accessibilityLabel: label };
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <MonthSwitcher month={month} onChange={setMonth} />
        <View style={styles.calendar}>
          <MonthCalendar month={month} renderDay={renderDay} />
        </View>
        <CalendarLegend
          items={[
            { tone: 'danger', label: 'School holiday' },
            { tone: 'holiday', label: 'Sunday' },
          ]}
        />
      </Card>

      <SectionHeader title={`Holidays in ${dayjs(from).format('MMMM')}`} />
      {holidays.length === 0 ? (
        <Text style={styles.none}>{query.isPending ? 'Loading…' : 'No holidays this month apart from Sundays.'}</Text>
      ) : (
        <Card padded={false}>
          {holidays.map(h => (
            <ListRow
              key={h.id}
              icon="sunny-outline"
              iconColor={colors.danger}
              iconBackground={colors.dangerSoft}
              title={h.name}
              subtitle={[
                h.startDate === h.endDate
                  ? dayjs(h.startDate).format('dddd, D MMM')
                  : `${dayjs(h.startDate).format('D MMM')} – ${dayjs(h.endDate).format('D MMM')}`,
                h.reason,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  calendar: { marginVertical: spacing.md },
  none: { ...typography.body, color: colors.textMuted },
}));

export default HolidayCalendarScreen;
