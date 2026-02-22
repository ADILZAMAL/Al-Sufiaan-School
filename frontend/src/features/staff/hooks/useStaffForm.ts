import { useState, useCallback } from 'react';
import { StaffFormData, StaffFormErrors } from '../types';

const initialFormData: StaffFormData = {
  // Staff Type
  staffType: '',
  // Personal Information
  name: '',
  gender: '',
  dateOfBirth: '',
  socialCategory: '',
  mobileNumber: '',
  email: '',
  aadhaarNumber: '',
  nameAsPerAadhaar: '',
  
  // Academic Qualifications
  highestAcademicQualification: '',
  tradeDegree: '',
  highestProfessionalQualification: '',
  
  // Role Information
  role: '',
  
  // Photo
  photoUrl: '',
  
  // Subject Competencies (Teaching Staff Only)
  mathematicsLevel: '',
  scienceLevel: '',
  englishLevel: '',
  socialScienceLevel: '',
  scheduleVIIILanguageLevel: '',
  
  // Employment Details
  typeOfDisability: '',
  natureOfAppointment: '',
  dateOfJoiningService: '',
  dateOfJoiningPresentSchool: '',
  
  // Financial Information
  salaryPerMonth: '',
  upiNumber: '',
  accountNumber: '',
  accountName: '',
  ifscCode: ''
};

export const useStaffForm = () => {
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = useCallback((field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: StaffFormErrors = {};

    if (step === 1) {
      // Personal & Academic Information validation
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.gender) {
        newErrors.gender = 'Gender is required';
      }
      
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
      
      if (!formData.mobileNumber.trim()) {
        newErrors.mobileNumber = 'Mobile number is required';
      } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
        newErrors.mobileNumber = 'Mobile number must be 10 digits';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      if (!formData.aadhaarNumber.trim()) {
        newErrors.aadhaarNumber = 'Aadhaar number is required';
      } else if (!/^[0-9]{12}$/.test(formData.aadhaarNumber)) {
        newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits';
      }
      
      if (!formData.nameAsPerAadhaar.trim()) {
        newErrors.nameAsPerAadhaar = 'Name as per Aadhaar is required';
      }
      
      if (!formData.role.trim()) {
        newErrors.role = 'Role is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      const maxSteps = 3; // Both teaching and non-teaching have 3 steps
      if (currentStep < maxSteps) {
        setCurrentStep(prev => prev + 1);
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setCurrentStep(1);
  }, []);

  const isStepValid = useCallback((step: number): boolean => {
    return validateStep(step);
  }, [validateStep]);

  return {
    formData,
    errors,
    currentStep,
    handleChange,
    validateStep,
    nextStep,
    prevStep,
    resetForm,
    isStepValid,
    setCurrentStep
  };
};
