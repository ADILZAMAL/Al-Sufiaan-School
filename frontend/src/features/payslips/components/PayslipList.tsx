import React from 'react';
import { HiEye, HiCalendar, HiCurrencyRupee } from 'react-icons/hi';
import { Payslip } from '../types';

interface PayslipListProps {
  payslips: Payslip[];
  onViewPayslip: (payslip: Payslip) => void;
  isLoading?: boolean;
}

const PayslipList: React.FC<PayslipListProps> = ({
  payslips,
  onViewPayslip,
  isLoading = false
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNPAID': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Fully Paid';
      case 'PARTIAL': return 'Partially Paid';
      case 'UNPAID': return 'Unpaid';
      default: return 'Unknown';
    }
  };



  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading payslips...</p>
      </div>
    );
  }

  if (payslips.length === 0) {
    return (
      <div className="text-center py-8">
        <HiCurrencyRupee className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payslips found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Payslips will appear here once generated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payslips.map((payslip) => (
        <div
          key={payslip.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <HiCalendar className="h-4 w-4 mr-1" />
                  {payslip.monthName} {payslip.year}
                </div>
                <div className="text-sm text-gray-500">
                  #{payslip.payslipNumber}
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Gross Salary:</span>
                  <div className="font-medium text-gray-900">
                    {formatCurrency(payslip.grossSalary)}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Deductions:</span>
                  <div className="font-medium text-red-600">
                    {formatCurrency(payslip.deductions)}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Paid:</span>
                  <div className="font-medium text-green-600">
                    {formatCurrency(payslip.totalPaidAmount || 0)}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Due:</span>
                  <div className="font-medium text-orange-600">
                    {formatCurrency(payslip.remainingAmount || payslip.netSalary)}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Generated:</span>
                  <div className="font-medium text-gray-900">
                    {formatDate(payslip.generatedDate)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                <span>Present: {payslip.presentDays} days</span>
                <span>Absent: {payslip.absentDays} days</span>
                <span>Half Days: {payslip.halfDays}</span>
                <span>CL: {payslip.casualLeave}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Payment Status Badge */}
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(payslip.paymentStatus)}`}>
                {getPaymentStatusText(payslip.paymentStatus)}
              </div>
              
              <button
                onClick={() => onViewPayslip(payslip)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="View Payslip"
              >
                <HiEye className="h-4 w-4 mr-1" />
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PayslipList;
