import React, { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiCreditCard, FiFileText } from 'react-icons/fi';

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollect: (paymentData: {
    amountPaid: number;
    paymentMode: string;
    referenceNumber?: string;
    remarks?: string;
  }) => Promise<void>;
  month: string;
  totalPayableAmount: number;
  paidAmount: number;
  dueAmount: number;
  loading?: boolean;
}

const PAYMENT_MODES = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Cheque',
  'Demand Draft',
];

const CollectFeeModal: React.FC<CollectFeeModalProps> = ({
  isOpen,
  onClose,
  onCollect,
  month,
  totalPayableAmount,
  paidAmount,
  dueAmount,
  loading = false,
}) => {
  const [amountPaid, setAmountPaid] = useState(dueAmount);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setAmountPaid(dueAmount);
      setPaymentMode('Cash');
      setReferenceNumber('');
      setRemarks('');
      setError('');
    }
  }, [isOpen, dueAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amountPaid || amountPaid <= 0) {
      setError('Amount paid must be greater than 0');
      return;
    }

    if (amountPaid > dueAmount) {
      setError(`Amount cannot exceed due amount of ₹${dueAmount.toLocaleString('en-IN')}`);
      return;
    }

    if (!paymentMode) {
      setError('Payment mode is required');
      return;
    }

    try {
      await onCollect({
        amountPaid,
        paymentMode,
        referenceNumber: referenceNumber || undefined,
        remarks: remarks || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to collect payment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Collect Fee Payment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Fee Summary */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Month</span>
              <span className="text-sm font-semibold text-gray-900">{month}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Payable</span>
              <span className="text-sm font-semibold text-gray-900">₹{totalPayableAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Already Paid</span>
              <span className="text-sm font-semibold text-green-600">₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Due Amount</span>
              <span className="text-lg font-bold text-red-600">₹{dueAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Paid */}
            <div>
              <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Collect (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amountPaid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={dueAmount}
                  step="0.01"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">₹</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum: ₹{dueAmount.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Payment Mode */}
            <div>
              <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <div className="relative">
                <select
                  id="paymentMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCreditCard className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reference number..."
                  disabled={loading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFileText className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Transaction ID, cheque number, etc.
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional notes..."
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiDollarSign className="mr-2 h-4 w-4" />
                    Collect Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollectFeeModal;
