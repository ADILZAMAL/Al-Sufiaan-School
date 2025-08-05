import React, { useState, useEffect } from 'react';
import { HiX, HiCalculator, HiCheck } from 'react-icons/hi';
import { PayslipFormData, PayslipFormErrors, MONTHS, YEARS } from '../types';
import { payslipApi } from '../api/payslips';
import { TeachingStaff, NonTeachingStaff } from '../../staff/types';
import Toast from '../../../components/common/Toast';

interface PayslipGeneratorProps {
  staff: TeachingStaff | NonTeachingStaff;
  staffType: 'teaching' | 'non-teaching';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payslip: any) => void;
}

const PayslipGenerator: React.FC<PayslipGeneratorProps> = ({
  staff,
  staffType,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<PayslipFormData>({
    staffId: staff.id!,
    staffType,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    workingDays: 26,
    absentDays: 0,
    casualLeave: 0,
    halfDays: 0,
    deductions: 0
  });

  const [errors, setErrors] = useState<PayslipFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [existingPayslip, setExistingPayslip] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  // Calculate salary preview
  const salaryCalculation = staff.salaryPerMonth 
    ? payslipApi.calculateSalary(
        staff.salaryPerMonth,
        formData.absentDays,
        formData.halfDays,
        formData.deductions
      )
    : null;

  useEffect(() => {
    if (formData.month && formData.year) {
      checkExistingPayslip();
    }
  }, [formData.month, formData.year]);

  const checkExistingPayslip = async () => {
    setIsChecking(true);
    try {
      const result = await payslipApi.checkExists(
        staffType,
        staff.id!,
        formData.month,
        formData.year
      );
      setExistingPayslip(result.exists ? result.payslip : null);
    } catch (error: any) {
      console.error('Error checking existing payslip:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleChange = (field: keyof PayslipFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: PayslipFormErrors = {};

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Please select a valid month';
    }

    if (!formData.year || formData.year < 2020 || formData.year > 2050) {
      newErrors.year = 'Please select a valid year';
    }

    if (formData.workingDays < 20 || formData.workingDays > 31) {
      newErrors.workingDays = 'Working days must be between 20 and 31';
    }

    if (formData.absentDays < 0 || formData.absentDays > 30) {
      newErrors.absentDays = 'Absent days must be between 0 and 30';
    }

    if (formData.casualLeave < 0 || formData.casualLeave > 30) {
      newErrors.casualLeave = 'Casual leave must be between 0 and 30';
    }

    if (formData.halfDays < 0 || formData.halfDays > 30) {
      newErrors.halfDays = 'Half days must be between 0 and 30';
    }

    if (formData.absentDays + formData.casualLeave + formData.halfDays > formData.workingDays) {
      newErrors.absentDays = 'Total absent days, casual leave, and half days cannot exceed working days';
    }

    if (formData.absentDays + formData.halfDays > 30) {
      newErrors.absentDays = 'Total absent days and half days cannot exceed 30';
    }

    if (formData.deductions < 0) {
      newErrors.deductions = 'Deductions cannot be negative';
    }

    if (!staff.salaryPerMonth) {
      newErrors.salary = 'Staff member does not have salary information';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (existingPayslip) {
      setToast({ 
        message: 'Payslip already exists for this month and year', 
        type: 'ERROR' 
      });
      return;
    }

    setIsLoading(true);
    try {
      const payslip = await payslipApi.generate(formData);
      setToast({ 
        message: 'Payslip generated successfully!', 
        type: 'SUCCESS' 
      });
      onSuccess(payslip);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to generate payslip', 
        type: 'ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Payslip - {staff.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Period Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payslip Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => handleChange('month', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.month ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Month</option>
                  {MONTHS.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="mt-1 text-sm text-red-600">{errors.month}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Year</option>
                  {YEARS.map(year => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                )}
              </div>
            </div>

            {/* Existing Payslip Warning */}
            {isChecking && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">Checking for existing payslip...</p>
              </div>
            )}

            {existingPayslip && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  ⚠️ Payslip already exists for {MONTHS.find(m => m.value === formData.month)?.label} {formData.year}
                  (Payslip #{existingPayslip.payslipNumber})
                </p>
              </div>
            )}
          </div>

          {/* Working Days */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Working Days</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Days in Month *
                </label>
                <input
                  type="number"
                  min="20"
                  max="31"
                  value={formData.workingDays}
                  onChange={(e) => handleChange('workingDays', parseInt(e.target.value) || 26)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.workingDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.workingDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.workingDays}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Total working days in the month (typically 20-31 days)</p>
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Absent Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.absentDays}
                  onChange={(e) => handleChange('absentDays', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.absentDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.absentDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.absentDays}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Casual Leave (CL)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.casualLeave}
                  onChange={(e) => handleChange('casualLeave', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.casualLeave ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.casualLeave && (
                  <p className="mt-1 text-sm text-red-600">{errors.casualLeave}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Paid leave - no salary deduction</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Half Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.halfDays}
                  onChange={(e) => handleChange('halfDays', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.halfDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.halfDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.halfDays}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deductions (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => handleChange('deductions', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.deductions ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.deductions && (
                  <p className="mt-1 text-sm text-red-600">{errors.deductions}</p>
                )}
              </div>
            </div>
          </div>

          {/* Salary Calculation Preview */}
          {salaryCalculation && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <HiCalculator className="h-5 w-5 mr-2" />
                Salary Calculation Preview
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span className="font-medium">₹{salaryCalculation.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per Day Salary:</span>
                    <span className="font-medium">₹{salaryCalculation.perDaySalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Days:</span>
                    <span className="font-medium">{salaryCalculation.totalDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Present Days:</span>
                    <span className="font-medium">{salaryCalculation.presentDays}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Gross Salary:</span>
                    <span className="font-medium">₹{salaryCalculation.grossSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Deductions:</span>
                    <span className="font-medium">₹{formData.deductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 col-span-2">
                    <span className="text-lg font-semibold">Net Salary:</span>
                    <span className="text-lg font-bold text-green-600">₹{salaryCalculation.netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errors.salary && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.salary}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || existingPayslip || !staff.salaryPerMonth}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <HiCheck className="h-4 w-4 mr-2" />
                  Generate Payslip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayslipGenerator;
