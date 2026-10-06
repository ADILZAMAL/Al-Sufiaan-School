import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRootNavigation } from '../navigation/types';
import { useCurrentUser } from '../context/AuthContext';
import { payslipApi } from '../api/payslip';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { usePullToRefresh } from '../hooks/useRefresh';
import { Badge, Card, EmptyState, ErrorState, SkeletonList } from '../components/ui';
import { makeStyles, useTheme } from '../theme';
import { Payslip } from '../types';

export const PAYSLIP_STATUS: Record<Payslip['paymentStatus'], { label: string; tone: 'danger' | 'warning' | 'success' }> = {
  UNPAID: { label: 'Unpaid', tone: 'danger' },
  PARTIAL: { label: 'Partly paid', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'success' },
};

export const formatRupees = (amount: number) => `₹${Number(amount).toLocaleString('en-IN')}`;

const PAGE_SIZE = 20;

const PayslipListScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const { staffId } = useCurrentUser();

  const query = useInfiniteQuery({
    queryKey: queryKeys.payslips(staffId),
    queryFn: ({ pageParam }) => payslipApi.getMyPayslips(staffId, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: last => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);
  const payslips = query.data?.pages.flatMap(p => p.payslips) ?? [];

  if (query.isPending) return <SkeletonList rows={5} />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={payslips}
      keyExtractor={p => String(p.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.4}
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
      ListEmptyComponent={
        <EmptyState icon="document-text-outline" title="No payslips yet" message="Your payslips will appear here once the office generates them." />
      }
      renderItem={({ item }) => {
        const status = PAYSLIP_STATUS[item.paymentStatus];
        return (
          <Card
            onPress={() => navigation.navigate('PayslipDetail', { payslipId: item.id, monthName: item.monthName, year: item.year })}
            accessibilityLabel={`${item.monthName} ${item.year}, net ${formatRupees(item.netSalary)}, ${status.label}`}
            style={styles.card}
          >
            <View style={styles.left}>
              <Text style={styles.period}>
                {item.monthName} {item.year}
              </Text>
              <Text style={styles.number}>{item.payslipNumber}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatRupees(item.netSalary)}</Text>
              <Badge label={status.label} tone={status.tone} />
            </View>
          </Card>
        );
      }}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  period: { ...typography.heading, color: colors.text },
  number: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { ...typography.heading, color: colors.text },
  footer: { marginVertical: spacing.lg },
}));

export default PayslipListScreen;
