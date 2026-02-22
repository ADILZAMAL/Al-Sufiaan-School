import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStaffForm } from '../hooks/useStaffForm';
import { staffApi } from '../api/staff';
import { StaffType } from '../types';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import EmploymentDetailsForm from '../components/EmploymentDetailsForm';
import SubjectLevelSelector from '../components/SubjectLevelSelector';
import FinancialDetailsForm from '../components/FinancialDetailsForm';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../../../components/common/Toast';

const AddStaff: React.FC = () => {
  const [searchParams] = useSearchParams();
  const staffType = (searchParams.get('type') || 'teaching') as StaffType;
  const navigate = useNavigate();

  const {
    formData,
    errors,
    currentStep,
    handleChange,
    nextStep,
    prevStep,
    resetForm
  } = useStaffForm();

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  const isTeaching = staffType === 'teaching';

  const handleNext = () => {
    if (currentStep === 3) {
      setShowConfirmation(true);
    } else {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!formData.gender || !['Male', 'Female', 'Other'].includes(formData.gender)) {
        setToast({ message: 'Please select a gender', type: 'ERROR' });
        setIsLoading(false);
        return;
      }

      const apiData = {
        ...formData,
        staffType,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        dateOfJoiningService: formData.dateOfJoiningService || undefined,
        dateOfJoiningPresentSchool: formData.dateOfJoiningService || undefined,
        salaryPerMonth: formData.salaryPerMonth ? parseFloat(formData.salaryPerMonth) : undefined,
        mathematicsLevel: isTeaching ? (formData.mathematicsLevel || undefined) : null,
        scienceLevel: isTeaching ? (formData.scienceLevel || undefined) : null,
        englishLevel: isTeaching ? (formData.englishLevel || undefined) : null,
        socialScienceLevel: isTeaching ? (formData.socialScienceLevel || undefined) : null,
        scheduleVIIILanguageLevel: isTeaching ? (formData.scheduleVIIILanguageLevel || undefined) : null,
        schoolId: 1 // This should come from context/auth
      };

      await staffApi.create(apiData as any);

      setToast({
        message: `${isTeaching ? 'Teaching' : 'Non-teaching'} staff added successfully!`,
        type: 'SUCCESS'
      });
      setShowConfirmation(false);

      setTimeout(() => {
        resetForm();
        navigate('/dashboard/staff');
      }, 2000);
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to add staff',
        type: 'ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDetailsForm
            formData={formData}
            errors={errors}
            onChange={handleChange}
            staffType={staffType}
          />
        );
      case 2:
        return (
          <div className="space-y-8">
            {isTeaching && (
              <SubjectLevelSelector
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />
            )}
            <EmploymentDetailsForm
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          </div>
        );
      case 3:
        return (
          <FinancialDetailsForm
            formData={formData}
            errors={errors}
            onChange={handleChange}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Personal & Academic Information';
      case 2: return isTeaching ? 'Subject Competencies & Employment Details' : 'Employment Details';
      case 3: return 'Financial Information';
      default: return '';
    }
  };

  const pageTitle = isTeaching ? 'Add Teaching Staff' : 'Add Non-Teaching Staff';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600">Step {currentStep} of 3: {getStepTitle()}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base font-medium ${
                    step <= currentStep
                      ? isTeaching ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-1 sm:mx-2 ${
                      step < currentStep
                        ? isTeaching ? 'bg-blue-600' : 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 sm:hidden">
            <span className={`text-xs ${currentStep >= 1 ? (isTeaching ? 'text-blue-600' : 'text-green-600') + ' font-medium' : 'text-gray-500'}`}>
              Personal
            </span>
            <span className={`text-xs ${currentStep >= 2 ? (isTeaching ? 'text-blue-600' : 'text-green-600') + ' font-medium' : 'text-gray-500'}`}>
              Employment
            </span>
            <span className={`text-xs ${currentStep >= 3 ? (isTeaching ? 'text-blue-600' : 'text-green-600') + ' font-medium' : 'text-gray-500'}`}>
              Financial
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="mb-6 sm:mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Previous
          </button>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
            <button
              onClick={() => navigate('/dashboard/staff')}
              className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className={`w-full sm:w-auto px-6 py-2 text-white rounded-md ${
                isTeaching ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {currentStep === 3 ? 'Save & Next' : 'Next'}
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
        isLoading={isLoading}
      />
    </div>
  );
};

export default AddStaff;
