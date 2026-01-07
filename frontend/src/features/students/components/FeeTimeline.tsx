import React from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiMinusCircle, FiDollarSign } from 'react-icons/fi';

interface FeeTimelineEntry {
  month: number;
  calendarYear: number;
  label: string;
  status: 'not_generated' | 'unpaid' | 'partial' | 'paid';
  monthlyFeeId?: number;
  totalPayableAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
}

interface FeeTimelineProps {
  timeline: FeeTimelineEntry[];
  loading?: boolean;
}

const FeeTimeline: React.FC<FeeTimelineProps> = ({ timeline, loading }) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 border-green-200';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200';
      case 'unpaid':
        return 'bg-red-50 border-red-200';
      case 'not_generated':
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs font-medium text-green-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-700">
            {timeline.filter(t => t.status === 'paid').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-xs font-medium text-yellow-600 mb-1">Partial</p>
          <p className="text-2xl font-bold text-yellow-700">
            {timeline.filter(t => t.status === 'partial').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs font-medium text-red-600 mb-1">Unpaid</p>
          <p className="text-2xl font-bold text-red-700">
            {timeline.filter(t => t.status === 'unpaid').length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Not Generated</p>
          <p className="text-2xl font-bold text-gray-700">
            {timeline.filter(t => t.status === 'not_generated').length}
          </p>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {timeline.map((entry, index) => (
          <div
            key={`${entry.calendarYear}-${entry.month}-${index}`}
            className={`rounded-lg border p-4 transition-all hover:shadow-md ${getStatusColor(entry.status)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">{entry.label}</h4>
              {getStatusBadge(entry.status)}
            </div>

            {entry.status !== 'not_generated' && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-gray-900">
                    {entry.totalPayableAmount ? formatCurrency(entry.totalPayableAmount) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-700">
                    {entry.paidAmount !== undefined ? formatCurrency(entry.paidAmount) : '₹0'}
                  </span>
                </div>
                {entry.dueAmount !== undefined && entry.dueAmount > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-700 font-medium">Due:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(entry.dueAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {entry.status === 'not_generated' && (
              <div className="flex items-center text-gray-500 text-sm mt-2">
                <FiDollarSign className="mr-1 h-4 w-4" />
                <span>Fee not yet generated</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeeTimeline;
