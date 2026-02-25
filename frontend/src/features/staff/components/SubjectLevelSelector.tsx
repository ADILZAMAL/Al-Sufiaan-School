import React from 'react';
import { StaffFormData, StaffFormErrors, SUBJECT_LEVEL_OPTIONS } from '../types';

interface SubjectLevelSelectorProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: string) => void;
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

const subjects: { field: keyof StaffFormData; label: string; colSpan?: boolean }[] = [
  { field: 'mathematicsLevel', label: 'Mathematics' },
  { field: 'scienceLevel', label: 'Science' },
  { field: 'englishLevel', label: 'English' },
  { field: 'socialScienceLevel', label: 'Social Science' },
  { field: 'scheduleVIIILanguageLevel', label: 'Language (Schedule VIII)', colSpan: true },
];

const SubjectLevelSelector: React.FC<SubjectLevelSelectorProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Subject Competencies
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Indicate the highest level studied for each subject
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjects.map(({ field, label, colSpan }) => (
          <div key={field} className={colSpan ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <select
              value={(formData[field] as string) || ''}
              onChange={(e) => onChange(field, e.target.value)}
              className={inputCls}
            >
              <option value="">Select Level</option>
              {SUBJECT_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectLevelSelector;
