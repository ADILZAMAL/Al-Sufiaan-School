import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createVendorBill } from '../api';
import { CreateVendorBillData } from '../types';

interface AddVendorBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendorId: number;
  vendorName: string;
}

const AddVendorBillModal: React.FC<AddVendorBillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vendorId,
  vendorName,
}) => {
  const [formData, setFormData] = useState<CreateVendorBillData>({
    amount: 0,
    name: '',
    vendorId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Bill description is required';
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = 'Enter a valid amount greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await createVendorBill({ ...formData, vendorId });
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating vendor bill:', error);
      setErrors({ submit: 'Failed to create bill. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ amount: 0, name: '', vendorId });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = (field: string) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Bill</h2>
            <p className="text-xs text-gray-400 mt-0.5">for {vendorName}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
            <FaTimes size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bill Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={inputCls('name')}
              placeholder="e.g. Electricity bill, Supplies"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleInputChange}
              min="0"
              className={inputCls('amount')}
              placeholder="Enter amount"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Creating...' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorBillModal;
