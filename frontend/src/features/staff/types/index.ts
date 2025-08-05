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
  role?: string;
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
  role?: string;
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
  
  // Role Information
  role: string;
  
  // Photo
  photoUrl: string;
  
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

export const TEACHING_STAFF_ROLES = [
  { value: 'Principal', label: 'Principal', description: 'Head of the school, responsible for overall administration.' },
  { value: 'Vice Principal', label: 'Vice Principal', description: 'Assists the principal in managing academics and discipline.' },
  { value: 'Head of Department (HOD)', label: 'Head of Department (HOD)', description: 'Senior teacher managing a specific subject department.' },
  { value: 'PGT (Post Graduate Teacher)', label: 'PGT (Post Graduate Teacher)', description: 'Teaches classes 11–12; usually holds a Master\'s and B.Ed.' },
  { value: 'TGT (Trained Graduate Teacher)', label: 'TGT (Trained Graduate Teacher)', description: 'Teaches classes 6–10; typically holds a Bachelor\'s and B.Ed.' },
  { value: 'PRT (Primary Teacher)', label: 'PRT (Primary Teacher)', description: 'Teaches classes 1–5.' },
  { value: 'NTT (Nursery Teacher)', label: 'NTT (Nursery Teacher)', description: 'Teaches pre-primary/nursery level students.' },
  { value: 'Assistant Teacher', label: 'Assistant Teacher', description: 'Supports main teacher, often in lower grades.' },
  { value: 'Special Educator', label: 'Special Educator', description: 'Provides learning support to CWSN (Children With Special Needs).' },
  { value: 'Physical Education Teacher (PET)', label: 'Physical Education Teacher (PET)', description: 'Handles sports and physical fitness.' },
  { value: 'Art / Music / Dance Teacher', label: 'Art / Music / Dance Teacher', description: 'Conducts extracurriculars.' },
  { value: 'Computer Teacher', label: 'Computer Teacher', description: 'Teaches ICT and computer-related subjects.' },
  { value: 'Librarian', label: 'Librarian', description: 'Manages the library and reading materials.' },
  { value: 'Lab Assistant', label: 'Lab Assistant', description: 'Assists in science lab preparation and safety.' }
];

export const NON_TEACHING_STAFF_ROLES = [
  { value: 'Administrator', label: 'Administrator', description: 'Handles overall non-academic operations.' },
  { value: 'Office Manager', label: 'Office Manager', description: 'Supervises day-to-day admin office work.' },
  { value: 'Accountant', label: 'Accountant', description: 'Manages school finance, payroll, and fees.' },
  { value: 'Clerk / Data Entry Operator', label: 'Clerk / Data Entry Operator', description: 'Maintains records, UDISE+ data, admission files, etc.' },
  { value: 'Receptionist', label: 'Receptionist', description: 'Front desk duties, communication, and coordination.' },
  { value: 'Admission Counselor', label: 'Admission Counselor', description: 'Handles inquiries, school tours, and student admissions.' },
  { value: 'IT Admin / Technician', label: 'IT Admin / Technician', description: 'Manages school IT infrastructure and websites.' },
  { value: 'Transport Incharge', label: 'Transport Incharge', description: 'Oversees school buses and transport logistics.' },
  { value: 'Peon / Office Assistant', label: 'Peon / Office Assistant', description: 'Assists in delivering files, cleaning staff rooms, etc.' },
  { value: 'Ayah / Nanny / Helper', label: 'Ayah / Nanny / Helper', description: 'Assists teachers in pre-primary classes.' },
  { value: 'Security Guard', label: 'Security Guard', description: 'Ensures campus security.' },
  { value: 'Cook', label: 'Cook', description: 'Prepares meals for students and staff.' },
  { value: 'Driver / Conductor', label: 'Driver / Conductor', description: 'For school buses.' },
  { value: 'Gardener (Mali)', label: 'Gardener (Mali)', description: 'Maintains school garden.' }
];
