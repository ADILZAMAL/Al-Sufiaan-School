import React from 'react';
import { HiX, HiPrinter } from 'react-icons/hi';
import { Payslip } from '../types';

interface PayslipViewProps {
  payslip: Payslip;
  isOpen: boolean;
  onClose: () => void;
}

const PayslipView: React.FC<PayslipViewProps> = ({
  payslip,
  isOpen,
  onClose
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

  const handlePrint = () => {
    window.print();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">
            Payslip - {payslip.monthName} {payslip.year}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              title="Print Payslip"
            >
              <HiPrinter className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Payslip Content */}
        <div className="p-8 print:p-4">
          {/* Header Section */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SALARY SLIP</h1>
            <div className="text-sm text-gray-600">
              <p className="font-semibold">{payslip.schoolName}</p>
              {payslip.schoolAddress && <p>{payslip.schoolAddress}</p>}
              <div className="flex justify-center space-x-4 mt-1">
                {payslip.schoolPhone && <span>Phone: {payslip.schoolPhone}</span>}
                {payslip.schoolEmail && <span>Email: {payslip.schoolEmail}</span>}
              </div>
            </div>
          </div>

          {/* Payslip Info */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p><strong>Payslip No:</strong> {payslip.payslipNumber}</p>
              <p><strong>Month/Year:</strong> {payslip.monthName} {payslip.year}</p>
            </div>
            <div className="text-right">
              <p><strong>Generated Date:</strong> {formatDate(payslip.generatedDate)}</p>
              <p><strong>Employee Type:</strong> {payslip.staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'}</p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
              EMPLOYEE DETAILS
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p><strong>Name:</strong> {payslip.staffName}</p>
                <p><strong>Email:</strong> {payslip.staffEmail}</p>
                <p><strong>Mobile:</strong> {payslip.staffMobile}</p>
                <p><strong>Role:</strong> {payslip.staffRole}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Aadhaar:</strong> {payslip.staffAadhaar}</p>
                {payslip.staffAccountNumber && (
                  <p><strong>Account No:</strong> {payslip.staffAccountNumber}</p>
                )}
                {payslip.staffIfscCode && (
                  <p><strong>IFSC Code:</strong> {payslip.staffIfscCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
              ATTENDANCE DETAILS
            </h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Working Days</p>
                <p className="text-lg font-semibold">{payslip.workingDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-lg font-semibold text-green-600">{payslip.presentDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Absent Days</p>
                <p className="text-lg font-semibold text-red-600">{payslip.absentDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Half Days</p>
                <p className="text-lg font-semibold text-orange-600">{payslip.halfDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Casual Leave (CL)</p>
                <p className="text-lg font-semibold text-blue-600">{payslip.casualLeave}</p>
                <p className="text-xs text-gray-500">Paid Leave</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded p-3 shadow-sm">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <h4 className="text-xs font-semibold text-gray-800 mb-1">Effective Salary Days</h4>
                  <div className="text-xl font-bold text-green-700 mb-1">{payslip.effectiveSalaryDays}</div>
                  <div className="bg-white bg-opacity-70 rounded px-2 py-1 border border-green-200">
                    <p className="text-xs text-gray-700">
                      30 - {payslip.absentDays} - {payslip.halfDays * 0.5} = {payslip.effectiveSalaryDays}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Calculation */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
              SALARY CALCULATION
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex justify-between">
                  <span>Basic Salary (Monthly):</span>
                  <span className="font-medium">{formatCurrency(payslip.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Per Day Salary:</span>
                  <span className="font-medium">{formatCurrency(payslip.perDaySalary)}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-300 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span>Present Days (Attendance):</span>
                  <span className="font-medium">{payslip.presentDays} days</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Present Days = {payslip.workingDays} (working) - {payslip.absentDays} (absent) - {payslip.casualLeave} (CL) - {payslip.halfDays * 0.5} (half days)
                </div>
                <div className="flex justify-between mb-2">
                  <span>Effective Salary Days:</span>
                  <span className="font-medium">{payslip.effectiveSalaryDays} days</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Salary Days = 30 - {payslip.absentDays} (absent) - {payslip.halfDays * 0.5} (half days = {payslip.halfDays})
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between text-lg mb-2">
                  <span className="font-semibold">Gross Salary:</span>
                  <span className="font-bold text-green-600">{formatCurrency(payslip.grossSalary)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>(-) Deductions:</span>
                  <span className="font-medium text-red-600">{formatCurrency(payslip.deductions)}</span>
                </div>
                <div className="border-t-2 border-gray-800 pt-2">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">NET SALARY:</span>
                    <span className="font-bold text-green-700">{formatCurrency(payslip.netSalary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-6">
            <p className="text-sm">
              <strong>Amount in Words:</strong> {/* TODO: Implement number to words conversion */}
              <span className="italic">
                {payslip.netSalary < 100000 
                  ? `Rupees ${Math.floor(payslip.netSalary).toLocaleString('en-IN')} only`
                  : `Rupees ${Math.floor(payslip.netSalary).toLocaleString('en-IN')} only`
                }
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 mt-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600">Generated on: {formatDate(payslip.generatedDate)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  This is a computer-generated payslip and does not require a signature.
                </p>
              </div>
              <div className="text-right">
                <div className="border-t border-gray-400 pt-2 mt-8 w-48">
                  <p className="text-sm text-gray-600">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;
