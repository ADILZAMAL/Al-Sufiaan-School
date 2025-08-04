import React from 'react';
import { StaffFormData, StaffFormErrors, NATURE_OF_APPOINTMENT_OPTIONS, DISABILITY_OPTIONS } from '../types';

interface EmploymentDetailsFormProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: string) => void;
}

const EmploymentDetailsForm: React.FC<EmploymentDetailsFormProps> = ({
  formData,
  errors,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type of Disability (If any)
          </label>
          <select
            value={formData.typeOfDisability}
            onChange={(e) => onChange('typeOfDisability', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Disability Type</option>
            {DISABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nature of Appointment
          </label>
          <select
            value={formData.natureOfAppointment}
            onChange={(e) => onChange('natureOfAppointment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Appointment Type</option>
            {NATURE_OF_APPOINTMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Joining
          </label>
          <input
            type="date"
            value={formData.dateOfJoiningService}
            onChange={(e) => onChange('dateOfJoiningService', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default EmploymentDetailsForm;
