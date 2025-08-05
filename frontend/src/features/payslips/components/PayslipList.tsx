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
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <HiCalendar className="h-4 w-4 mr-1" />
                  {payslip.monthName} {payslip.year}
                </div>
                <div className="text-sm text-gray-500">
                  #{payslip.payslipNumber}
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                  <span className="text-gray-500">Net Salary:</span>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(payslip.netSalary)}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Generated:</span>
                  <div className="font-medium text-gray-900">
                    {formatDate(payslip.generatedDate)}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>Present: {payslip.presentDays} days</span>
                <span>Absent: {payslip.absentDays} days</span>
                <span>Half Days: {payslip.halfDays}</span>
                <span>CL: {payslip.casualLeave}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
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
