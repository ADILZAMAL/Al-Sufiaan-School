export type StaffType = 'teaching' | 'non-teaching';

export interface StaffLoginStatus {
  enabled: boolean;
  userId: number | null;
  mobileNumber: string | null;
  lastLogin: string | null;
}

export interface Staff {
  id?: number;
  staffType: StaffType;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  socialCategory?: string;
  mobileNumber: string;
  email: string;
  aadhaarNumber: string;
  nameAsPerAadhaar: string;
  highestAcademicQualification?: string;
  tradeDegree?: string;
  highestProfessionalQualification?: string;
  designationId?: number | null;
  designation?: { id: number; name: string } | null;
  photoUrl?: string;
  active?: boolean;
  mathematicsLevel?: string | null;
  scienceLevel?: string | null;
  englishLevel?: string | null;
  socialScienceLevel?: string | null;
  scheduleVIIILanguageLevel?: string | null;
  typeOfDisability?: string;
  natureOfAppointment?: string;
  dateOfJoiningService?: string;
  dateOfJoiningPresentSchool?: string;
  salaryPerMonth?: number;
  upiNumber?: string;
  accountNumber?: string;
  accountName?: string;
  ifscCode?: string;
  schoolId: number;
  createdAt?: string;
  updatedAt?: string;
  loginEnabled?: boolean;
  loginStatus?: StaffLoginStatus;
}

export interface TeachingStaff {
  id?: number;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  socialCategory?: string;
  mobileNumber: string;
  email: string;
  aadhaarNumber: string;
  nameAsPerAadhaar: string;
  highestAcademicQualification?: string;
  tradeDegree?: string;
  highestProfessionalQualification?: string;
  photoUrl?: string;
  active?: boolean;
  mathematicsLevel?: string;
  scienceLevel?: string;
  englishLevel?: string;
  socialScienceLevel?: string;
  scheduleVIIILanguageLevel?: string;
  typeOfDisability?: string;
  natureOfAppointment?: string;
  dateOfJoiningService?: string;
  dateOfJoiningPresentSchool?: string;
  salaryPerMonth?: number;
  upiNumber?: string;
  accountNumber?: string;
  accountName?: string;
  ifscCode?: string;
  schoolId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NonTeachingStaff {
  id?: number;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  socialCategory?: string;
  mobileNumber: string;
  email: string;
  aadhaarNumber: string;
  nameAsPerAadhaar: string;
  highestAcademicQualification?: string;
  tradeDegree?: string;
  highestProfessionalQualification?: string;
  photoUrl?: string;
  active?: boolean;
  typeOfDisability?: string;
  natureOfAppointment?: string;
  dateOfJoiningService?: string;
  dateOfJoiningPresentSchool?: string;
  salaryPerMonth?: number;
  upiNumber?: string;
  accountNumber?: string;
  accountName?: string;
  ifscCode?: string;
  schoolId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffFormData {
  // Staff Type
  staffType: StaffType | '';

  // Personal Information
  name: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dateOfBirth: string;
  socialCategory: string;
  mobileNumber: string;
  email: string;
  aadhaarNumber: string;
  nameAsPerAadhaar: string;
  
  // Academic Qualifications
  highestAcademicQualification: string;
  tradeDegree: string;
  highestProfessionalQualification: string;
  
  designationId: number | '';

  // Photo
  photoUrl: string;  // Existing photo URL (for edit mode)
  photoFile?: File;  // New photo file (for upload)
  photoPreview?: string;  // Preview of new photo
  
  // Subject Competencies (Teaching Staff Only)
  mathematicsLevel?: string;
  scienceLevel?: string;
  englishLevel?: string;
  socialScienceLevel?: string;
  scheduleVIIILanguageLevel?: string;
  
  // Employment Details
  typeOfDisability: string;
  natureOfAppointment: string;
  dateOfJoiningService: string;
  dateOfJoiningPresentSchool: string;
  
  // Financial Information
  salaryPerMonth: string;
  upiNumber: string;
  accountNumber: string;
  accountName: string;
  ifscCode: string;
}

export interface StaffFormErrors {
  [key: string]: string;
}

export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
];

export const SOCIAL_CATEGORY_OPTIONS = [
  { value: 'General', label: 'General' },
  { value: 'OBC', label: 'OBC' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
  { value: 'EWS', label: 'EWS' }
];

export const ACADEMIC_QUALIFICATION_OPTIONS = [
  { value: 'Below Secondary', label: 'Below Secondary' },
  { value: 'Secondary', label: 'Secondary' },
  { value: 'Higher Secondary', label: 'Higher Secondary' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Post Graduate', label: 'Post Graduate' },
  { value: 'M.Phil', label: 'M.Phil' },
  { value: 'Ph.D', label: 'Ph.D' },
  { value: 'Post Doctoral', label: 'Post Doctoral' }
];

export const TRADE_DEGREE_OPTIONS = {
  'Below Secondary': [{ value: 'Not Applicable', label: 'Not Applicable' }],
  'Secondary': [{ value: 'Not Applicable', label: 'Not Applicable' }],
  'Higher Secondary': [{ value: 'Not Applicable', label: 'Not Applicable' }],
  'Graduate': [
    { value: 'B.A', label: 'B.A' },
    { value: 'B.Sc', label: 'B.Sc' },
    { value: 'B.Com', label: 'B.Com' },
    { value: 'BBA', label: 'BBA' },
    { value: 'BCA', label: 'BCA' },
    { value: 'B.Tech', label: 'B.Tech' },
    { value: 'BE', label: 'BE' },
    { value: 'LLB', label: 'LLB' },
    { value: 'MBBS', label: 'MBBS' },
    { value: 'Others', label: 'Others' }
  ],
  'Post Graduate': [
    { value: 'M.A', label: 'M.A' },
    { value: 'M.Sc', label: 'M.Sc' },
    { value: 'M.Com', label: 'M.Com' },
    { value: 'MBA', label: 'MBA' },
    { value: 'MCA', label: 'MCA' },
    { value: 'M.Tech', label: 'M.Tech' },
    { value: 'ME', label: 'ME' },
    { value: 'Others', label: 'Others' }
  ],
  'M.Phil': [{ value: 'Not Applicable', label: 'Not Applicable' }],
  'Ph.D': [{ value: 'Not Applicable', label: 'Not Applicable' }],
  'Post Doctoral': [{ value: 'Not Applicable', label: 'Not Applicable' }]
};

export const SUBJECT_LEVEL_OPTIONS = [
  { value: 'Primary', label: 'Primary' },
  { value: 'Upper Primary', label: 'Upper Primary' },
  { value: 'Secondary', label: 'Secondary' },
  { value: 'Higher Secondary', label: 'Higher Secondary' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Post Graduate', label: 'Post Graduate' }
];

export const NATURE_OF_APPOINTMENT_OPTIONS = [
  { value: 'Regular', label: 'Regular' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Guest', label: 'Guest' },
  { value: 'Part Time', label: 'Part Time' },
  { value: 'Temporary', label: 'Temporary' }
];

export const DISABILITY_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'Visual Impairment', label: 'Visual Impairment' },
  { value: 'Hearing Impairment', label: 'Hearing Impairment' },
  { value: 'Physical Disability', label: 'Physical Disability' },
  { value: 'Intellectual Disability', label: 'Intellectual Disability' },
  { value: 'Multiple Disabilities', label: 'Multiple Disabilities' }
];

