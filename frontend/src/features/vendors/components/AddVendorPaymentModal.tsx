import React, { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { createVendorPayment } from '../api';
import { CreateVendorPaymentData } from '../types';

interface AddVendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendorId: number;
  vendorName: string;
  dueAmount: number;
}

const AddVendorPaymentModal: React.FC<AddVendorPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vendorId,
  vendorName,
  dueAmount,
}) => {
  const [formData, setFormData] = useState<CreateVendorPaymentData>({
    amount: 0,
    paymentMethod: 'cash',
    vendorId,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate payment amount
    if (formData.amount > dueAmount) {
      setError(`Payment amount cannot exceed due amount of ${formatCurrency(dueAmount)}`);
      setIsSubmitting(false);
      return;
    }

    if (formData.amount <= 0) {
      setError('Payment amount must be greater than 0');
      setIsSubmitting(false);
      return;
    }

    try {
      await createVendorPayment(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        amount: 0,
        paymentMethod: 'cash',
        vendorId,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Make Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Payment to:</p>
          <p className="font-medium text-gray-900">{vendorName}</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">Due Amount:</p>
            <p className="font-medium text-red-600">{formatCurrency(dueAmount)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              min="0"
              max={dueAmount}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter payment amount"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum amount: {formatCurrency(dueAmount)}</p>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional notes about the payment"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Make Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorPaymentModal;
