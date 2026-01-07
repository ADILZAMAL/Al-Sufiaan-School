import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiMinusCircle, FiPlus, FiDollarSign } from 'react-icons/fi';
import { generateMonthlyFee, collectFeePayment } from '../api';
import GenerateFeeModal from './GenerateFeeModal';
import CollectFeeModal from './CollectFeeModal';

interface FeeItem {
  feeType: string;
  amount: number;
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
}

interface FeeTimelineProps {
  timeline: FeeTimelineEntry[];
  loading?: boolean;
  studentId: number;
  onRefresh: () => void;
}

const FeeTimeline: React.FC<FeeTimelineProps> = ({ 
  timeline, 
  loading, 
  studentId,
  onRefresh 
}) => {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FeeTimelineEntry | null>(null);
  const [generatingFee, setGeneratingFee] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState(false);

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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Month/Year
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Tuition
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Hostel
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Transport
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Admission
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Discount
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Payable
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Paid
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Due
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeline.map((entry, index) => (
              <tr key={`${entry.calendarYear}-${entry.month}-${index}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{entry.label}</span>
                </td>
                
                {entry.status === 'not_generated' ? (
                  <>
                    <td colSpan={9} className="px-4 py-3 text-center">
                      <button
                        onClick={() => openGenerateModal(entry)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <FiPlus className="mr-1 h-4 w-4" />
                        Generate Fee
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(entry.status)}
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
                      <div className="flex items-center justify-center space-x-2">
                        {entry.status !== 'paid' && (
                          <button
                            onClick={() => openCollectModal(entry)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
                            title="Collect Payment"
                          >
                            <FiDollarSign className="h-3 w-3 mr-1" />
                            Collect
                          </button>
                        )}
                        {getStatusBadge(entry.status)}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
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
    </div>
  );
};

export default FeeTimeline;
