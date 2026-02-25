import React from 'react';
import { StaffFormData, StaffFormErrors, NATURE_OF_APPOINTMENT_OPTIONS, DISABILITY_OPTIONS } from '../types';

interface EmploymentDetailsFormProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: string) => void;
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

const EmploymentDetailsForm: React.FC<EmploymentDetailsFormProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Employment Details
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type of Disability (if any)
          </label>
          <select
            value={formData.typeOfDisability}
            onChange={(e) => onChange('typeOfDisability', e.target.value)}
            className={inputCls}
          >
            <option value="">Select Disability Type</option>
            {DISABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nature of Appointment
          </label>
          <select
            value={formData.natureOfAppointment}
            onChange={(e) => onChange('natureOfAppointment', e.target.value)}
            className={inputCls}
          >
            <option value="">Select Appointment Type</option>
            {NATURE_OF_APPOINTMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date of Joining
          </label>
          <input
            type="date"
            value={formData.dateOfJoiningService}
            onChange={(e) => onChange('dateOfJoiningService', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
};

export default EmploymentDetailsForm;
