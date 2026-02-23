import React from 'react';
import {
  StaffFormData,
  StaffFormErrors,
  GENDER_OPTIONS,
  SOCIAL_CATEGORY_OPTIONS,
  ACADEMIC_QUALIFICATION_OPTIONS,
  TRADE_DEGREE_OPTIONS,
  TEACHING_STAFF_ROLES,
  NON_TEACHING_STAFF_ROLES,
} from '../types';
import PhotoUpload from '../../../components/common/PhotoUpload';

interface PersonalDetailsFormProps {
  formData: StaffFormData;
  errors: StaffFormErrors;
  onChange: (field: keyof StaffFormData, value: any) => void;
  staffType?: 'teaching' | 'non-teaching';
}

const inputCls = (error?: string) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
  }`;

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  formData,
  errors,
  onChange,
  staffType = 'teaching',
}) => {
  return (
    <div className="space-y-7">

      {/* Personal Information */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Personal Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className={inputCls(errors.name)}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => onChange('gender', e.target.value)}
              className={inputCls(errors.gender)}
            >
              <option value="">Select Gender</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className={inputCls(errors.dateOfBirth)}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Social Category
            </label>
            <select
              value={formData.socialCategory}
              onChange={(e) => onChange('socialCategory', e.target.value)}
              className={inputCls()}
            >
              <option value="">Select Category</option>
              {SOCIAL_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => onChange('mobileNumber', e.target.value)}
              className={inputCls(errors.mobileNumber)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className={inputCls(errors.email)}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Aadhaar Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.aadhaarNumber}
              onChange={(e) => onChange('aadhaarNumber', e.target.value)}
              className={inputCls(errors.aadhaarNumber)}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
            />
            {errors.aadhaarNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.aadhaarNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name as per Aadhaar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nameAsPerAadhaar}
              onChange={(e) => onChange('nameAsPerAadhaar', e.target.value)}
              className={inputCls(errors.nameAsPerAadhaar)}
              placeholder="Enter name as per Aadhaar"
            />
            {errors.nameAsPerAadhaar && (
              <p className="text-red-500 text-xs mt-1">{errors.nameAsPerAadhaar}</p>
            )}
          </div>
        </div>
      </div>

      {/* Photo */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Photo
        </p>
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
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Academic Qualifications
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Highest Academic Qualification
            </label>
            <select
              value={formData.highestAcademicQualification}
              onChange={(e) => {
                onChange('highestAcademicQualification', e.target.value);
                onChange('tradeDegree', '');
              }}
              className={inputCls()}
            >
              <option value="">Select Qualification</option>
              {ACADEMIC_QUALIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trade / Degree
            </label>
            <select
              value={formData.tradeDegree}
              onChange={(e) => onChange('tradeDegree', e.target.value)}
              className={inputCls()}
              disabled={!formData.highestAcademicQualification}
            >
              <option value="">Select Trade/Degree</option>
              {formData.highestAcademicQualification &&
                TRADE_DEGREE_OPTIONS[
                  formData.highestAcademicQualification as keyof typeof TRADE_DEGREE_OPTIONS
                ]?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Role */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Role
        </p>
        <div className="max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => onChange('role', e.target.value)}
            className={inputCls(errors.role)}
          >
            <option value="">Select Role</option>
            {(staffType === 'teaching' ? TEACHING_STAFF_ROLES : NON_TEACHING_STAFF_ROLES).map(
              (role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              )
            )}
          </select>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
          {formData.role && (
            <p className="text-xs text-gray-500 mt-2">
              {(staffType === 'teaching' ? TEACHING_STAFF_ROLES : NON_TEACHING_STAFF_ROLES).find(
                (r) => r.value === formData.role
              )?.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
