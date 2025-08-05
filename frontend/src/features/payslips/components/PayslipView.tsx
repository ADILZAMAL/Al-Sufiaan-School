import React, { useState, useEffect } from 'react';
import { HiX, HiPrinter, HiCurrencyRupee, HiCash, HiCreditCard } from 'react-icons/hi';
import { Payslip, PayslipWithPayments, PaymentFormData, PAYMENT_METHODS } from '../types';
import { payslipApi } from '../api/payslips';

interface PayslipViewProps {
  payslip: Payslip;
  isOpen: boolean;
  onClose: () => void;
  onPayslipUpdated?: () => void;
}

const PayslipView: React.FC<PayslipViewProps> = ({
  payslip,
  isOpen,
  onClose,
  onPayslipUpdated
}) => {
  const [payslipWithPayments, setPayslipWithPayments] = useState<PayslipWithPayments | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    paymentAmount: 0,
    paymentMethod: 'Cash',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleClose = () => {
    onClose();
    // Trigger payslip list reload if callback is provided
    if (onPayslipUpdated) {
      onPayslipUpdated();
    }
  };

  // Load payslip with payment details
  useEffect(() => {
    if (isOpen && payslip.id) {
      loadPayslipWithPayments();
    }
  }, [isOpen, payslip.id]);

  const loadPayslipWithPayments = async () => {
    try {
      setIsLoading(true);
      const data = await payslipApi.getWithPayments(payslip.id!);
      setPayslipWithPayments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!payslip.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await payslipApi.makePayment(payslip.id, paymentForm);
      
      // Reload payslip data
      await loadPayslipWithPayments();
      
      // Reset form
      setPaymentForm({
        paymentAmount: 0,
        paymentMethod: 'Cash',
        notes: ''
      });
      setShowPaymentForm(false);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100';
      case 'PARTIAL': return 'text-yellow-600 bg-yellow-100';
      case 'UNPAID': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash': return <HiCash className="h-4 w-4" />;
      case 'UPI': return <HiCreditCard className="h-4 w-4" />;
      case 'Bank Transfer': return <HiCreditCard className="h-4 w-4" />;
      default: return <HiCurrencyRupee className="h-4 w-4" />;
    }
  };

  // Use payslipWithPayments if available, otherwise use the original payslip
  const currentPayslip = payslipWithPayments || payslip;


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
              onClick={handleClose}
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

          {/* Payment Status and Management */}
          <div className="mb-6 print:hidden">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
              PAYMENT STATUS
            </h3>
            
            {/* Payment Status Summary */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Net Salary</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(currentPayslip.netSalary)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(currentPayslip.totalPaidAmount || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(currentPayslip.remainingAmount || currentPayslip.netSalary)}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(currentPayslip.paymentStatus || 'UNPAID')}`}>
                    {currentPayslip.paymentStatus || 'UNPAID'}
                  </span>
                </div>
                
                {currentPayslip.paymentStatus !== 'PAID' && (
                  <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <HiCurrencyRupee className="h-4 w-4 mr-2" />
                    Make Payment
                  </button>
                )}
              </div>
            </div>

            {/* Payment Form */}
            {showPaymentForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Make Payment</h4>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      max={currentPayslip.remainingAmount || currentPayslip.netSalary}
                      step="0.01"
                      value={paymentForm.paymentAmount === 0 ? '' : paymentForm.paymentAmount}
                      onChange={(e) => setPaymentForm({
                        ...paymentForm,
                        paymentAmount: e.target.value === '' ? 0 : parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {formatCurrency(currentPayslip.remainingAmount || currentPayslip.netSalary)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value as 'Cash' | 'UPI' | 'Bank Transfer'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      notes: e.target.value
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Payment notes or reference..."
                  />
                </div>
                
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    onClick={handleMakePayment}
                    disabled={isLoading || paymentForm.paymentAmount <= 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Processing...' : 'Record Payment'}
                  </button>
                  
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Payment History */}
            {(currentPayslip as PayslipWithPayments).payments && (currentPayslip as PayslipWithPayments).payments!.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800">Payment History</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {(currentPayslip as PayslipWithPayments).payments!.map((payment, index) => (
                    <div key={payment.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.paymentAmount)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            via {payment.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </p>
                          {payment.paidByUser && (
                            <p className="text-xs text-gray-500">
                              by {payment.paidByUser.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Note: {payment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
