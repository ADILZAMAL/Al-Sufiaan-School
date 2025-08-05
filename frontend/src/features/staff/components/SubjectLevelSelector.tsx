import React from 'react';
import { StaffFormData, StaffFormErrors, SUBJECT_LEVEL_OPTIONS } from '../types';

interface SubjectLevelSelectorProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: string) => void;
}

const SubjectLevelSelector: React.FC<SubjectLevelSelectorProps> = ({
  formData,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Competencies</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please mention the level up to which the following subjects are studied:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mathematics
          </label>
          <select
            value={formData.mathematicsLevel || ''}
            onChange={(e) => onChange('mathematicsLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            {SUBJECT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Science
          </label>
          <select
            value={formData.scienceLevel || ''}
            onChange={(e) => onChange('scienceLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            {SUBJECT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            English
          </label>
          <select
            value={formData.englishLevel || ''}
            onChange={(e) => onChange('englishLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            {SUBJECT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Social Science
          </label>
          <select
            value={formData.socialScienceLevel || ''}
            onChange={(e) => onChange('socialScienceLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            {SUBJECT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language (as per Schedule VIII)
          </label>
          <select
            value={formData.scheduleVIIILanguageLevel || ''}
            onChange={(e) => onChange('scheduleVIIILanguageLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            {SUBJECT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SubjectLevelSelector;
