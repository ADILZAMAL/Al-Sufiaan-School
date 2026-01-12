import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiMinusCircle, FiPlus, FiChevronDown, FiChevronRight, FiFileText } from 'react-icons/fi';
import { generateMonthlyFee, collectFeePayment } from '../api';
import GenerateFeeModal from './GenerateFeeModal';
import CollectFeeModal from './CollectFeeModal';
import FeeReceiptModal from './FeeReceiptModal';
import { School } from '../../../api/school';

interface FeeItem {
  feeType: string;
  amount: number;
}

interface PaymentDetail {
  id: number;
  amountPaid: number;
  paymentDate: Date;
  paymentMode: string;
  referenceNumber: string | null;
  remarks: string | null;
  receivedBy: string | null;
}

interface FeeTimelineEntry {
  month: number;
  calendarYear: number;
  label: string;
  status: 'not_generated' | 'unpaid' | 'partial' | 'paid';
  monthlyFeeId?: number;
  totalConfiguredAmount?: number;
  totalAdjustment?: number;
  totalPayableAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  discountReason?: string | null;
  feeItems?: FeeItem[] | null;
  payments?: PaymentDetail[];
}

interface StudentInfo {
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber?: string | null;
  className: string;
  sectionName: string;
  schoolId: number;
  fatherName?: string;
  dayboarding?: boolean;
}

interface FeeTimelineProps {
  timeline: FeeTimelineEntry[];
  loading?: boolean;
  studentId: number;
  onRefresh: () => void;
  student?: StudentInfo;
  school?: School;
}

const FeeTimeline: React.FC<FeeTimelineProps> = ({ 
  timeline, 
  loading, 
  studentId,
  onRefresh,
  student,
  school
}) => {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FeeTimelineEntry | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(null);
  const [generatingFee, setGeneratingFee] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1 h-3 w-3" />
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiAlertCircle className="mr-1 h-3 w-3" />
            Partial
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiAlertCircle className="mr-1 h-3 w-3" />
            Unpaid
          </span>
        );
      case 'not_generated':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiMinusCircle className="mr-1 h-3 w-3" />
            Not Generated
          </span>
        );
    }
  };

  const getFeeItemAmount = (feeItems: FeeItem[] | null | undefined, feeType: string): number => {
    if (!feeItems) return 0;
    const item = feeItems.find(item => item.feeType === feeType);
    return item ? item.amount : 0;
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return '-';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleGenerateFee = async (feeData: any) => {
    setGeneratingFee(true);
    try {
      await generateMonthlyFee(studentId, feeData);
      onRefresh();
    } catch (error: any) {
      throw error;
    } finally {
      setGeneratingFee(false);
    }
  };

  const handleCollectPayment = async (paymentData: any) => {
    setCollectingPayment(true);
    try {
      await collectFeePayment(studentId, selectedEntry!.monthlyFeeId!, paymentData);
      onRefresh();
    } catch (error: any) {
      throw error;
    } finally {
      setCollectingPayment(false);
    }
  };

  const openGenerateModal = (entry: FeeTimelineEntry) => {
    setSelectedEntry(entry);
    setIsGenerateModalOpen(true);
  };

  const openCollectModal = (entry: FeeTimelineEntry) => {
    setSelectedEntry(entry);
    setIsCollectModalOpen(true);
  };

  const openReceiptModal = (payment: PaymentDetail, entry: FeeTimelineEntry) => {
    setSelectedPayment(payment);
    setSelectedEntry(entry);
    setIsReceiptModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p>No fee timeline data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fee Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Month/Year
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Tuition
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Hostel
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Transport
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Admn
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Dayboard
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Total
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Disc
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Payable
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Paid
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Due
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeline.map((entry, index) => {
              const rowKey = `${entry.calendarYear}-${entry.month}-${index}`;
              const isExpanded = expandedRows.has(rowKey);
              const hasPayments = entry.payments && entry.payments.length > 0;

              return (
                <React.Fragment key={rowKey}>
                  {/* Main Row */}
                  <tr 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (entry.status === 'not_generated') {
                        openGenerateModal(entry);
                      } else if (hasPayments) {
                        toggleRow(rowKey);
                      } else if (entry.status !== 'paid') {
                        openCollectModal(entry);
                      }
                    }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {hasPayments && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(rowKey);
                            }}
                            className="mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? (
                              <FiChevronDown className="h-4 w-4" />
                            ) : (
                              <FiChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <span className="text-sm font-medium text-gray-900">{entry.label}</span>
                      </div>
                    </td>
                    
                    {entry.status === 'not_generated' ? (
                      <>
                        <td colSpan={10} className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openGenerateModal(entry);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <FiPlus className="mr-1 h-4 w-4" />
                            Generate Fee
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          -
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(getFeeItemAmount(entry.feeItems, 'TUITION_FEE'))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(getFeeItemAmount(entry.feeItems, 'HOSTEL_FEE'))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(getFeeItemAmount(entry.feeItems, 'TRANSPORT_FEE'))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(getFeeItemAmount(entry.feeItems, 'ADMISSION_FEE'))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(getFeeItemAmount(entry.feeItems, 'DAYBOARDING_FEE'))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(entry.totalConfiguredAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`text-sm ${entry.totalAdjustment && entry.totalAdjustment > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                            {formatCurrency(entry.totalAdjustment)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(entry.totalPayableAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`text-sm ${entry.paidAmount && entry.paidAmount > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                            {formatCurrency(entry.paidAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`text-sm font-semibold ${entry.dueAmount && entry.dueAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {formatCurrency(entry.dueAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {entry.status !== 'paid' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCollectModal(entry);
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                              title="Collect Payment"
                            >
                              Collect
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Payment History Row (Expandable) */}
                  {isExpanded && hasPayments && (
                    <tr className="bg-gray-50">
                      <td colSpan={12} className="px-4 py-3">
                        <div className="ml-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase">
                                  <th className="pb-2 pr-4">Date</th>
                                  <th className="pb-2 pr-4">Amount</th>
                                  <th className="pb-2 pr-4">Mode</th>
                                  <th className="pb-2 pr-4">Reference</th>
                                  <th className="pb-2 pr-4">Received By</th>
                                  <th className="pb-2 pr-4">Remarks</th>
                                  <th className="pb-2">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {entry.payments!.map((payment) => (
                                  <tr key={payment.id} className="text-sm">
                                    <td className="py-2 pr-4 text-gray-900">
                                      {formatDate(payment.paymentDate)}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-900">
                                      {formatCurrency(payment.amountPaid)}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-900">
                                      {payment.paymentMode}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-900">
                                      {payment.referenceNumber || '-'}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-900">
                                      {payment.receivedBy || '-'}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">
                                      {payment.remarks || '-'}
                                    </td>
                                    <td className="py-2">
                                      <button
                                        onClick={() => openReceiptModal(payment, entry)}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                        title="View Receipt"
                                      >
                                        <FiFileText className="mr-1 h-3 w-3" />
                                        Receipt
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Generate Fee Modal */}
      {selectedEntry && (
        <GenerateFeeModal
          isOpen={isGenerateModalOpen}
          onClose={() => {
            setIsGenerateModalOpen(false);
            setSelectedEntry(null);
          }}
          onGenerate={handleGenerateFee}
          month={selectedEntry.month}
          calendarYear={selectedEntry.calendarYear}
          label={selectedEntry.label}
          loading={generatingFee}
          studentDayboarding={student?.dayboarding}
        />
      )}

      {/* Collect Fee Modal */}
      {selectedEntry && selectedEntry.status !== 'not_generated' && (
        <CollectFeeModal
          isOpen={isCollectModalOpen}
          onClose={() => {
            setIsCollectModalOpen(false);
            setSelectedEntry(null);
          }}
          onCollect={handleCollectPayment}
          month={selectedEntry.label}
          totalPayableAmount={selectedEntry.totalPayableAmount || 0}
          paidAmount={selectedEntry.paidAmount || 0}
          dueAmount={selectedEntry.dueAmount || 0}
          loading={collectingPayment}
        />
      )}

      {/* Fee Receipt Modal */}
      {selectedPayment && selectedEntry && student && school && (
        <FeeReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedPayment(null);
            setSelectedEntry(null);
          }}
          payment={selectedPayment}
          month={selectedEntry.label}
          feeItems={selectedEntry.feeItems || null}
          totalConfiguredAmount={selectedEntry.totalConfiguredAmount}
          totalAdjustment={selectedEntry.totalAdjustment}
          totalPayableAmount={selectedEntry.totalPayableAmount || 0}
          paidAmount={selectedPayment.amountPaid}
          discountReason={selectedEntry.discountReason}
          student={student}
          school={school}
          allPayments={(selectedEntry.payments || []).filter(p => p.id <= selectedPayment.id)}
        />
      )}
    </div>
  );
};

export default FeeTimeline;
