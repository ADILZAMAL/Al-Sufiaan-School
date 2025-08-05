import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffForm } from '../hooks/useStaffForm';
import { teachingStaffApi } from '../api/teachingStaff';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import EmploymentDetailsForm from '../components/EmploymentDetailsForm';
import SubjectLevelSelector from '../components/SubjectLevelSelector';
import FinancialDetailsForm from '../components/FinancialDetailsForm';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../../../components/common/Toast';

const AddTeachingStaff: React.FC = () => {
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
      // Validate required fields before submission
      if (!formData.gender || !['Male', 'Female', 'Other'].includes(formData.gender)) {
        setToast({ message: 'Please select a gender', type: 'ERROR' });
        setIsLoading(false);
        return;
      }

      // Convert form data to API format
      const apiData = {
        ...formData,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        dateOfBirth: formData.dateOfBirth,
        dateOfJoiningService: formData.dateOfJoiningService || undefined,
        dateOfJoiningPresentSchool: formData.dateOfJoiningService || undefined, // Use same date for both fields
        salaryPerMonth: formData.salaryPerMonth ? parseFloat(formData.salaryPerMonth) : undefined,
        schoolId: 1 // This should come from context/auth
      };

      await teachingStaffApi.create(apiData);
      
      setToast({ message: 'Teaching staff added successfully!', type: 'SUCCESS' });
      setShowConfirmation(false);
      
      // Reset form and redirect after a short delay
      setTimeout(() => {
        resetForm();
        navigate('/dashboard/staff');
      }, 2000);
      
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Failed to add teaching staff', 
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
            staffType="teaching"
          />
        );
      case 2:
        return (
          <div className="space-y-8">
            <SubjectLevelSelector
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
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
      case 1:
        return 'Personal & Academic Information';
      case 2:
        return 'Subject Competencies & Employment Details';
      case 3:
        return 'Financial Information';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Teaching Staff</h1>
          <p className="text-gray-600">Step {currentStep} of 3: {getStepTitle()}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="space-x-4">
            <button
              onClick={() => navigate('/dashboard/staff')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        staffType="teaching"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AddTeachingStaff;
