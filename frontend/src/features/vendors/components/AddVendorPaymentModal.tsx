import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }
    if (formData.amount > dueAmount) {
      setError(`Payment cannot exceed due amount of ${formatCurrency(dueAmount)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createVendorPayment(formData);
      onSuccess();
      onClose();
      setFormData({
        amount: 0,
        paymentMethod: 'cash',
        vendorId,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputCls =
    'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Make Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">to {vendorName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FaTimes size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Due amount info */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
              dueAmount > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-sm text-gray-600 font-medium">Outstanding due</span>
            <span
              className={`text-sm font-bold ${
                dueAmount > 0 ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {formatCurrency(dueAmount)}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              min="0"
              max={dueAmount}
              required
              className={inputCls}
              placeholder="Enter payment amount"
            />
            <p className="text-xs text-gray-400 mt-1">Max: {formatCurrency(dueAmount)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              className={inputCls}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
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
