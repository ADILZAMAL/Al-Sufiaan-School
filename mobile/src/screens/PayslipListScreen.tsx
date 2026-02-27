import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { payslipApi } from '../api/payslip';
import { Payslip } from '../types';

type PayslipListNavigationProp = StackNavigationProp<RootStackParamList, 'PayslipList'>;

const STATUS_CONFIG = {
  UNPAID: { label: 'Unpaid', bg: '#fee2e2', text: '#dc2626' },
  PARTIAL: { label: 'Partial', bg: '#fef9c3', text: '#ca8a04' },
  PAID: { label: 'Paid', bg: '#dcfce7', text: '#16a34a' },
};

const PayslipCard: React.FC<{ payslip: Payslip; onPress: () => void }> = ({ payslip, onPress }) => {
  const status = STATUS_CONFIG[payslip.paymentStatus];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardPeriod}>
          {payslip.monthName} {payslip.year}
        </Text>
        <Text style={styles.cardNumber}>{payslip.payslipNumber}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardSalary}>₹{Number(payslip.netSalary).toLocaleString('en-IN')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PayslipListScreen: React.FC = () => {
  const navigation = useNavigation<PayslipListNavigationProp>();
  const { user } = useAuth();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    if (!user?.staffId) {
      setError('Staff information not found.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const response = await payslipApi.getMyPayslips(user.staffId);
      setPayslips(response.payslips);
    } catch {
      setError('Failed to load payslips. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.staffId]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayslips();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchPayslips(); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (payslips.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📄</Text>
        <Text style={styles.emptyTitle}>No Payslips Yet</Text>
        <Text style={styles.emptySubtitle}>Your payslips will appear here once they are generated.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={payslips}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      renderItem={({ item }) => (
        <PayslipCard
          payslip={item}
          onPress={() =>
            navigation.navigate('PayslipDetail', {
              payslipId: item.id,
              monthName: item.monthName,
              year: item.year,
            })
          }
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  list: {
    padding: 16,
    backgroundColor: '#f3f4f6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
  },
  cardPeriod: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cardSalary: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default PayslipListScreen;
