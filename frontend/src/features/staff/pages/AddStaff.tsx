import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { HiArrowLeft, HiCheck } from 'react-icons/hi';
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

  const { formData, errors, currentStep, handleChange, nextStep, prevStep, resetForm } =
    useStaffForm();

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  const isTeaching = staffType === 'teaching';
  const accentBtn = isTeaching ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const accentLine = isTeaching ? 'bg-blue-600' : 'bg-emerald-600';
  const accentRing = isTeaching ? 'ring-blue-100' : 'ring-emerald-100';

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
        schoolId: 1,
      };

      await staffApi.create(apiData as any);
      setToast({
        message: `${isTeaching ? 'Teaching' : 'Non-teaching'} staff added successfully!`,
        type: 'SUCCESS',
      });
      setShowConfirmation(false);
      setTimeout(() => {
        resetForm();
        navigate('/dashboard/staff');
      }, 2000);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to add staff', type: 'ERROR' });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Personal & Academic' },
    { number: 2, label: isTeaching ? 'Subjects & Employment' : 'Employment' },
    { number: 3, label: 'Financial' },
  ];

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
              <SubjectLevelSelector formData={formData} errors={errors} onChange={handleChange} />
            )}
            <EmploymentDetailsForm formData={formData} errors={errors} onChange={handleChange} />
          </div>
        );
      case 3:
        return <FinancialDetailsForm formData={formData} errors={errors} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/staff"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <HiArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isTeaching ? 'Add Teaching Staff' : 'Add Non-Teaching Staff'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Step {currentStep} of 3</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <div className="flex items-start">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step.number < currentStep
                        ? `${accentLine} text-white`
                        : step.number === currentStep
                        ? `${accentLine} text-white ring-4 ${accentRing}`
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <HiCheck className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center leading-tight hidden sm:block max-w-[80px] ${
                      step.number <= currentStep ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-3 pt-4">
                    <div
                      className={`h-0.5 w-full transition-all ${
                        step.number < currentStep ? accentLine : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pb-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <HiArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/staff')}
              className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className={`px-6 py-2.5 rounded-lg text-white text-sm font-medium transition ${accentBtn}`}
            >
              {currentStep === 3 ? 'Review & Save' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        formData={formData}
        staffType={staffType}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isLoading}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default AddStaff;
