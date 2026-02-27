import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../navigation/AppNavigator';
import { payslipApi } from '../api/payslip';
import { PayslipWithPayments, PayslipPayment } from '../types';

type PayslipDetailRouteProp = RouteProp<RootStackParamList, 'PayslipDetail'>;

const STATUS_CONFIG = {
  UNPAID: { label: 'Unpaid', bg: '#fee2e2', text: '#dc2626' },
  PARTIAL: { label: 'Partial', bg: '#fef9c3', text: '#ca8a04' },
  PAID: { label: 'Paid', bg: '#dcfce7', text: '#16a34a' },
};

const Row: React.FC<{ label: string; value: string; bold?: boolean; highlight?: boolean }> = ({
  label,
  value,
  bold,
  highlight,
}) => (
  <View style={[styles.row, highlight && styles.rowHighlight]}>
    <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
  </View>
);

const buildPayslipHtml = (payslip: PayslipWithPayments): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1f2937; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 13px; color: #6b7280; margin-bottom: 20px; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 13px; font-weight: bold; color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; font-size: 13px; }
    td:last-child { text-align: right; font-weight: 600; }
    .highlight { background: #f0fdf4; }
    .highlight td { font-weight: bold; color: #16a34a; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .UNPAID { background: #fee2e2; color: #dc2626; }
    .PARTIAL { background: #fef9c3; color: #ca8a04; }
    .PAID { background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>
  <h1>${payslip.schoolName}</h1>
  <p class="subtitle">Salary Slip — ${payslip.monthName} ${payslip.year}</p>

  <div class="section">
    <div class="section-title">Staff Details</div>
    <table>
      <tr><td>Name</td><td>${payslip.staffName}</td></tr>
      <tr><td>Designation</td><td>${payslip.staffRole}</td></tr>
      <tr><td>Payslip No.</td><td>${payslip.payslipNumber}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Attendance</div>
    <table>
      <tr><td>Working Days</td><td>${payslip.workingDays}</td></tr>
      <tr><td>Present Days</td><td>${Number(payslip.presentDays).toFixed(1)}</td></tr>
      <tr><td>Absent Days</td><td>${payslip.absentDays}</td></tr>
      <tr><td>Casual Leave</td><td>${payslip.casualLeave}</td></tr>
      <tr><td>Half Days</td><td>${payslip.halfDays}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Salary</div>
    <table>
      <tr><td>Base Salary</td><td>₹${Number(payslip.baseSalary).toLocaleString('en-IN')}</td></tr>
      <tr><td>Gross Salary</td><td>₹${Number(payslip.grossSalary).toLocaleString('en-IN')}</td></tr>
      <tr><td>Deductions</td><td>₹${Number(payslip.deductions).toLocaleString('en-IN')}</td></tr>
      <tr class="highlight"><td>Net Salary</td><td>₹${Number(payslip.netSalary).toLocaleString('en-IN')}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Payment</div>
    <table>
      <tr><td>Status</td><td><span class="badge ${payslip.paymentStatus}">${STATUS_CONFIG[payslip.paymentStatus].label}</span></td></tr>
      <tr><td>Paid</td><td>₹${Number(payslip.totalPaidAmount).toLocaleString('en-IN')}</td></tr>
      <tr><td>Remaining</td><td>₹${Number(payslip.remainingAmount).toLocaleString('en-IN')}</td></tr>
    </table>
  </div>
</body>
</html>
`;

const DetailsTab: React.FC<{ payslip: PayslipWithPayments }> = ({ payslip }) => {
  const status = STATUS_CONFIG[payslip.paymentStatus];
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff</Text>
        <Row label="Name" value={payslip.staffName} />
        <Row label="Designation" value={payslip.staffRole} />
        <Row label="Payslip No." value={payslip.payslipNumber} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <Row label="Working Days" value={`${payslip.workingDays}`} />
        <Row label="Present Days" value={`${Number(payslip.presentDays).toFixed(1)}`} />
        <Row label="Absent Days" value={`${payslip.absentDays}`} />
        <Row label="Casual Leave" value={`${payslip.casualLeave}`} />
        <Row label="Half Days" value={`${payslip.halfDays}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary</Text>
        <Row label="Base Salary" value={`₹${Number(payslip.baseSalary).toLocaleString('en-IN')}`} />
        <Row label="Gross Salary" value={`₹${Number(payslip.grossSalary).toLocaleString('en-IN')}`} />
        <Row label="Deductions" value={`₹${Number(payslip.deductions).toLocaleString('en-IN')}`} />
        <Row label="Net Salary" value={`₹${Number(payslip.netSalary).toLocaleString('en-IN')}`} bold highlight />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
        <Row label="Paid" value={`₹${Number(payslip.totalPaidAmount).toLocaleString('en-IN')}`} />
        <Row label="Remaining" value={`₹${Number(payslip.remainingAmount).toLocaleString('en-IN')}`} />
        {payslip.lastPaymentDate && (
          <Row
            label="Last Payment"
            value={new Date(payslip.lastPaymentDate).toLocaleDateString('en-IN')}
          />
        )}
      </View>
    </ScrollView>
  );
};

const PaymentsTab: React.FC<{ payments: PayslipPayment[] }> = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <View style={styles.emptyPayments}>
        <Text style={styles.emptyIcon}>💳</Text>
        <Text style={styles.emptyTitle}>No Payments Yet</Text>
        <Text style={styles.emptySubtitle}>Payment records will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {payments.map((payment) => (
        <View key={payment.id} style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentAmount}>
              ₹{Number(payment.paymentAmount).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
          </View>
          <Text style={styles.paymentDate}>
            {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          {payment.notes ? <Text style={styles.paymentNotes}>{payment.notes}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
};

const PayslipDetailScreen: React.FC = () => {
  const route = useRoute<PayslipDetailRouteProp>();
  const { payslipId } = route.params;

  const [payslip, setPayslip] = useState<PayslipWithPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await payslipApi.getPayslipWithPayments(payslipId);
        setPayslip(data);
      } catch {
        setError('Failed to load payslip details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [payslipId]);

  const handleSavePdf = async () => {
    if (!payslip) return;
    setSaving(true);
    try {
      const html = buildPayslipHtml(payslip);
      const { uri: tempUri } = await Print.printToFileAsync({ html });

      const fileName = `${payslip.payslipNumber}.pdf`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({ from: tempUri, to: destUri });

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(destUri, { mimeType: 'application/pdf' });
        } else {
          Alert.alert('Saved', `Payslip saved to:\n${destUri}`);
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to save payslip PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !payslip) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Payslip not found.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            Payments ({payslip.payments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={styles.tabContainer}>
        {activeTab === 'details' ? (
          <DetailsTab payslip={payslip} />
        ) : (
          <PaymentsTab payments={payslip.payments} />
        )}
      </View>

      {/* Save PDF button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSavePdf}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>⬇  Save PDF</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowHighlight: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    borderRadius: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  rowValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  rowBold: {
    fontWeight: '700',
    color: '#1f2937',
    fontSize: 15,
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
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  paymentMethod: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  paymentDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentNotes: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyPayments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default PayslipDetailScreen;
