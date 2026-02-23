import React from 'react';
import { StaffFormData, StaffFormErrors } from '../types';

interface FinancialDetailsFormProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: string) => void;
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

const FinancialDetailsForm: React.FC<FinancialDetailsFormProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-7">

      {/* Salary */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Salary
        </p>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Monthly Salary (₹)
          </label>
          <input
            type="number"
            value={formData.salaryPerMonth}
            onChange={(e) => onChange('salaryPerMonth', e.target.value)}
            className={inputCls}
            placeholder="Enter monthly salary"
            min="0"
          />
        </div>
      </div>

      {/* Payment Details */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Payment Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
            <input
              type="text"
              value={formData.upiNumber}
              onChange={(e) => onChange('upiNumber', e.target.value)}
              className={inputCls}
              placeholder="example@upi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => onChange('accountNumber', e.target.value)}
              className={inputCls}
              placeholder="Enter bank account number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => onChange('accountName', e.target.value)}
              className={inputCls}
              placeholder="Enter account holder name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code</label>
            <input
              type="text"
              value={formData.ifscCode}
              onChange={(e) => onChange('ifscCode', e.target.value)}
              className={inputCls}
              placeholder="ABCD0123456"
              maxLength={11}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDetailsForm;
