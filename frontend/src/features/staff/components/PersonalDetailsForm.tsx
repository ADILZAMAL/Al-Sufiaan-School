import React from 'react';
import { StaffFormData, StaffFormErrors, GENDER_OPTIONS, SOCIAL_CATEGORY_OPTIONS, ACADEMIC_QUALIFICATION_OPTIONS, TRADE_DEGREE_OPTIONS, TEACHING_STAFF_ROLES, NON_TEACHING_STAFF_ROLES } from '../types';
import PhotoUpload from '../../../components/common/PhotoUpload';

interface PersonalDetailsFormProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: any) => void;
  staffType?: 'teaching' | 'non-teaching';
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  formData,
  errors,
  onChange,
  staffType = 'teaching'
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal & Academic Information</h3>
      
      {/* Personal Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Gender</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Social Category
          </label>
          <select
            value={formData.socialCategory}
            onChange={(e) => onChange('socialCategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            {SOCIAL_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => onChange('mobileNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
          />
          {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aadhaar Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.aadhaarNumber}
            onChange={(e) => onChange('aadhaarNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter 12-digit Aadhaar number"
            maxLength={12}
          />
          {errors.aadhaarNumber && <p className="text-red-500 text-sm mt-1">{errors.aadhaarNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name as per Aadhaar <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nameAsPerAadhaar}
            onChange={(e) => onChange('nameAsPerAadhaar', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nameAsPerAadhaar ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter name as per Aadhaar"
          />
          {errors.nameAsPerAadhaar && <p className="text-red-500 text-sm mt-1">{errors.nameAsPerAadhaar}</p>}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="mt-6">
        <PhotoUpload
          file={formData.photoFile || null}
          preview={formData.photoPreview || formData.photoUrl || null}
          onChange={(file, preview) => {
            onChange('photoFile', file);
            onChange('photoPreview', preview);
          }}
          onRemove={() => {
            onChange('photoFile', null);
            onChange('photoPreview', '');
          }}
          label="Staff Photo"
        />
      </div>

      {/* Academic Qualifications */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">Academic Qualifications</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Highest Academic Qualification
            </label>
            <select
              value={formData.highestAcademicQualification}
              onChange={(e) => {
                onChange('highestAcademicQualification', e.target.value);
                // Reset trade/degree when academic qualification changes
                onChange('tradeDegree', '');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Qualification</option>
              {ACADEMIC_QUALIFICATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trade/Degree
            </label>
            <select
              value={formData.tradeDegree}
              onChange={(e) => onChange('tradeDegree', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.highestAcademicQualification}
            >
              <option value="">Select Trade/Degree</option>
              {formData.highestAcademicQualification && 
                TRADE_DEGREE_OPTIONS[formData.highestAcademicQualification as keyof typeof TRADE_DEGREE_OPTIONS]?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">Role Information</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => onChange('role', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.role ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Role</option>
            {(staffType === 'teaching' ? TEACHING_STAFF_ROLES : NON_TEACHING_STAFF_ROLES).map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
          {formData.role && (
            <p className="text-sm text-gray-600 mt-2">
              {(staffType === 'teaching' ? TEACHING_STAFF_ROLES : NON_TEACHING_STAFF_ROLES)
                .find(role => role.value === formData.role)?.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
