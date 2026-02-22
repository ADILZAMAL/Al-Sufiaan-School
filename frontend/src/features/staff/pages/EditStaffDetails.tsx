import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiCheck } from 'react-icons/hi';
import { staffApi } from '../api/staff';
import { Staff, StaffFormData } from '../types';
import { useStaffForm } from '../hooks/useStaffForm';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import EmploymentDetailsForm from '../components/EmploymentDetailsForm';
import FinancialDetailsForm from '../components/FinancialDetailsForm';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../../../components/common/Toast';

const EditStaffDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  const {
    formData,
    errors,
    currentStep,
    handleChange,
    validateStep,
    nextStep,
    prevStep
  } = useStaffForm();

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  const fetchStaffDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const staffData = await staffApi.getById(parseInt(id));
      setStaff(staffData);
      populateForm(staffData);
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to fetch staff details',
        type: 'ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (staffData: Staff) => {
    const formattedData: Partial<StaffFormData> = {
      name: staffData.name,
      gender: staffData.gender as 'Male' | 'Female' | 'Other',
      dateOfBirth: staffData.dateOfBirth,
      socialCategory: staffData.socialCategory || '',
      mobileNumber: staffData.mobileNumber,
      email: staffData.email,
      aadhaarNumber: staffData.aadhaarNumber,
      nameAsPerAadhaar: staffData.nameAsPerAadhaar,
      highestAcademicQualification: staffData.highestAcademicQualification || '',
      tradeDegree: staffData.tradeDegree || '',
      role: staffData.role || '',
      photoUrl: staffData.photoUrl || '',
      typeOfDisability: staffData.typeOfDisability || '',
      natureOfAppointment: staffData.natureOfAppointment || '',
      dateOfJoiningService: staffData.dateOfJoiningService || '',
      salaryPerMonth: staffData.salaryPerMonth?.toString() || '',
      upiNumber: staffData.upiNumber || '',
      accountNumber: staffData.accountNumber || '',
      accountName: staffData.accountName || '',
      ifscCode: staffData.ifscCode || ''
    };

    if (staffData.staffType === 'teaching') {
      formattedData.mathematicsLevel = staffData.mathematicsLevel || '';
      formattedData.scienceLevel = staffData.scienceLevel || '';
      formattedData.englishLevel = staffData.englishLevel || '';
      formattedData.socialScienceLevel = staffData.socialScienceLevel || '';
      formattedData.scheduleVIIILanguageLevel = staffData.scheduleVIIILanguageLevel || '';
    }

    Object.entries(formattedData).forEach(([key, value]) => {
      if (value !== undefined) {
        handleChange(key as keyof StaffFormData, value);
      }
    });
  };

  const handleSubmit = async () => {
    if (!staff?.id) return;

    setIsSaving(true);
    try {
      const submitData = {
        ...formData,
        gender: formData.gender || undefined,
        salaryPerMonth: formData.salaryPerMonth ? parseFloat(formData.salaryPerMonth) : undefined,
        schoolId: staff.schoolId,
        staffType: staff.staffType
      };

      await staffApi.update(staff.id, submitData);

      setToast({ message: 'Staff details updated successfully!', type: 'SUCCESS' });
      setTimeout(() => navigate(`/dashboard/staff/view/${staff.id}`), 2000);
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update staff details',
        type: 'ERROR'
      });
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        setShowConfirmation(true);
      } else {
        nextStep();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Staff member not found</p>
        </div>
      </div>
    );
  }

  const staffType = staff.staffType;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Edit {staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'} Staff
        </h1>
        <p className="text-gray-600">Update details for {staff.name}</p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">
                {step === 1 && 'Personal & Academic Info'}
                {step === 2 && (staffType === 'teaching' ? 'Subject Competencies & Employment' : 'Employment Details')}
                {step === 3 && 'Financial Information'}
              </div>
              {step < 3 && (
                <div
                  className={`ml-4 w-16 h-1 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          {currentStep === 1 && (
            <PersonalDetailsForm
              formData={formData}
              errors={errors}
              onChange={handleChange}
              staffType={staffType}
            />
          )}

          {currentStep === 2 && (
            <EmploymentDetailsForm
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          )}

          {currentStep === 3 && (
            <FinancialDetailsForm
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/dashboard/staff/view/${staff.id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HiArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>

              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {currentStep === 3 ? (
                <>
                  <HiCheck className="h-4 w-4 mr-2" />
                  Update Staff
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        formData={formData}
        staffType={staffType}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isSaving}
      />
    </div>
  );
};

export default EditStaffDetails;
