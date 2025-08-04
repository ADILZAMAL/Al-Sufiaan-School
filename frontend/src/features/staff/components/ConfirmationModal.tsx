import React from 'react';
import { StaffFormData } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  formData: StaffFormData;
  staffType: 'teaching' | 'non-teaching';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  formData,
  staffType,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Confirm {staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'} Staff Details
        </h2>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
            <div className="flex items-start space-x-6">
              {/* Photo */}
              {formData.photoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={formData.photoUrl.startsWith('http') ? formData.photoUrl : `http://localhost:7000/${formData.photoUrl}`}
                    alt="Staff photo"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
              
              {/* Personal Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Gender:</strong> {formData.gender}</div>
                <div><strong>Date of Birth:</strong> {formatDate(formData.dateOfBirth)}</div>
                <div><strong>Social Category:</strong> {formData.socialCategory || 'Not specified'}</div>
                <div><strong>Mobile Number:</strong> {formData.mobileNumber}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Aadhaar Number:</strong> {formData.aadhaarNumber}</div>
                <div><strong>Name as per Aadhaar:</strong> {formData.nameAsPerAadhaar}</div>
              </div>
            </div>
          </div>

          {/* Academic Qualifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Academic Qualifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Highest Academic Qualification:</strong> {formData.highestAcademicQualification || 'Not specified'}</div>
              <div><strong>Trade/Degree:</strong> {formData.tradeDegree || 'Not specified'}</div>
            </div>
          </div>

          {/* Role Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Role Information</h3>
            <div className="text-sm">
              <div><strong>Role:</strong> {formData.role || 'Not specified'}</div>
            </div>
          </div>

          {/* Subject Competencies (Teaching Staff Only) */}
          {staffType === 'teaching' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Subject Competencies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Mathematics:</strong> {formData.mathematicsLevel || 'Not specified'}</div>
                <div><strong>Science:</strong> {formData.scienceLevel || 'Not specified'}</div>
                <div><strong>English:</strong> {formData.englishLevel || 'Not specified'}</div>
                <div><strong>Social Science:</strong> {formData.socialScienceLevel || 'Not specified'}</div>
                <div className="md:col-span-2"><strong>Language (Schedule VIII):</strong> {formData.scheduleVIIILanguageLevel || 'Not specified'}</div>
              </div>
            </div>
          )}

          {/* Employment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Type of Disability:</strong> {formData.typeOfDisability || 'Not specified'}</div>
              <div><strong>Nature of Appointment:</strong> {formData.natureOfAppointment || 'Not specified'}</div>
              <div><strong>Date of Joining:</strong> {formatDate(formData.dateOfJoiningService)}</div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Salary per Month:</strong> ₹{formData.salaryPerMonth || 'Not specified'}</div>
              <div><strong>UPI Number:</strong> {formData.upiNumber || 'Not specified'}</div>
              <div><strong>Account Number:</strong> {formData.accountNumber || 'Not specified'}</div>
              <div><strong>Account Name:</strong> {formData.accountName || 'Not specified'}</div>
              <div className="md:col-span-2"><strong>IFSC Code:</strong> {formData.ifscCode || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Confirm & Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
