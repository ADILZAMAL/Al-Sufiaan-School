// Base enums matching backend
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
  NA = 'NA',
}

export enum Religion {
  ISLAM = 'Islam',
  HINDUISM = 'Hinduism',
  CHRISTIANITY = 'Christianity',
  SIKHISM = 'Sikhism',
  BUDDHISM = 'Buddhism',
  JAINISM = 'Jainism',
  OTHER = 'Other'
}

// Common interfaces
export interface Class {
  id: number;
  name: string;
}

export interface Section {
  id: number;
  name: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

// Main Student interface - matches backend model structure exactly
export interface Student {
  id: number;
  schoolId: number;
  admissionNumber: string;
  admissionDate: string;
  lastName: string; // Swapped order to match backend
  firstName: string; // Swapped order to match backend
  email?: string;
  phone: string; // Required in backend
  dateOfBirth: string; // Required in backend
  gender: Gender; // Required in backend
  bloodGroup: BloodGroup; // Required in backend
  religion: Religion; // Required in backend
  aadhaarNumber: string; // Required in backend
  classId: number; // Required in backend
  sectionId: number; // Required in backend
  rollNumber?: string; // Optional in backend (string in backend, was string here)
  address: string; // Required in backend
  city: string; // Required in backend
  state: string; // Required in backend
  pincode: string; // Required in backend
  fatherName: string; // Required in backend
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName: string; // Required in backend
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  createdBy: number; // Required in backend

  // Timestamps (matching backend)
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
  
  // Optional: Include associated data from frontend queries
  class: Class; // Including class details for frontend use
  section: Section; // Including section details for frontend use
  creator: User; // Including creator details for frontend use

  // Virtual field for full name (computed in backend)
  fullName: string; // Available from backend getter
  
  // Fee information
  totalDue?: number; // Total outstanding fee amount
}

// Create Student Request - matches what backend expects
export interface CreateStudentRequest {
  admissionDate: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string; // Sent as string (YYYY-MM-DD format)
  gender: Gender;
  bloodGroup: BloodGroup;
  religion: Religion;
  aadhaarNumber?: string; // Optional in backend, but required in our validation rules
  classId: number;
  sectionId?: number; // Optional in some contexts
  rollNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  fatherName: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName: string;
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
}

// Update Student Request - partial of CreateStudentRequest
export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  // Add any fields that might be needed specifically for updates
  id?: number; // Sometimes needed for update operations
}

// Enhanced Student Form Data with better type safety
export interface StudentFormData {
  // Admission Information
  admissionNumber: string;
  admissionDate: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | '';
  bloodGroup: BloodGroup | '';
  religion: Religion | '';
  aadhaarNumber: string;
  
  // Contact Information
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Academic Information
  classId: number | null;
  sectionId: number | null;
  rollNumber: string;
  
  // Father Information
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  
  // Mother Information
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  
  // Guardian Information
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
}

// API Response Types
export interface StudentResponse {
  success: boolean;
  message: string;
  data?: Student;
}

export interface StudentListResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

// Filter and Query Types
export interface StudentFilters {
  search?: string;
  classId?: number;
  sectionId?: number;
  gender?: Gender;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  rule?: string; // The validation rule that failed
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
  code?: string; // Error code for better error handling
}

// Form validation state
export interface FormValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Loading states for different operations
export interface StudentLoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

// Table/Display Settings
export interface StudentTableSettings {
  itemsPerPage: number;
  currentPage: number;
  sortBy: keyof Student;
  sortOrder: 'asc' | 'desc';
  filters: StudentFilters;
}

// Export/Import Types (for future features)
export interface StudentExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: (keyof Student)[];
  filters?: StudentFilters;
}

export interface StudentImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ValidationError[];
}

// Utility types for form handling
export type StudentFormField = keyof StudentFormData;
export type StudentFormFieldValue = StudentFormData[StudentFormField];

// Type guards for validation
export const isValidGender = (value: string): value is Gender => {
  return Object.values(Gender).includes(value as Gender);
};

export const isValidBloodGroup = (value: string): value is BloodGroup => {
  return Object.values(BloodGroup).includes(value as BloodGroup);
};

export const isValidReligion = (value: string): value is Religion => {
  return Object.values(Religion).includes(value as Religion);
};

// Common validation patterns (matching backend patterns)
export const VALIDATION_PATTERNS = {
  INDIAN_PHONE: /^(\+91)?[6-9]\d{9}$/,
  AADHAAR: /^[0-9]{12}$/,
  PINCODE: /^[0-9]{6}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[a-zA-Z\s]{1,100}$/,
  ADMISSION_NUMBER: /^[a-zA-Z0-9-]{1,50}$/
} as const;

// Default values for forms

// Error messages matching backend validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please provide a valid email address',
  PHONE_INVALID: 'Phone number must be a valid Indian mobile number',
  AADHAAR_INVALID: 'Aadhaar number must be 12 digits',
  PINCODE_INVALID: 'Pincode must be 6 digits',
  NAME_LENGTH: 'Name must be between 1 and 100 characters',
  DATE_FUTURE: 'Date of birth must be in the past',
  SCHOOL_CODE_LENGTH: 'School code is required',
  ADMISSION_UNIQUE: 'Admission number must be unique',
  FATHER_NAME_REQUIRED: 'Father name is required',
  MOTHER_NAME_REQUIRED: 'Mother name is required'
} as const;
