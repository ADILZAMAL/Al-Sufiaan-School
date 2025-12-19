// Enums
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

export interface Student {
  id: number;
  schoolId: number;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  religion: Religion;
  aadhaarNumber: string;
  classId: number;
  class: { id: number; name: string }; // Including class details
  sectionId: number;
  section: { id: number; name: string }; // Including section details
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
  createdBy: number;
  creator: { firstName: string; lastName: string }; // Including creator details
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateStudentRequest {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string; // Assuming date is sent as string
  gender: Gender;
  bloodGroup: BloodGroup;
  religion: Religion;
  aadhaarNumber?: string;
  classId: number;
  sectionId?: number;
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

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {}

export interface StudentFormData {
  // Personal Information
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  religion: Religion;
  aadhaarNumber: string;
  
  // Contact Information
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  
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

export interface StudentResponse {
  success: boolean;
  message: string;
  data?: Student;
}

export interface StudentFilters {
  search?: string;
  classId?: number;
  sectionId?: number;
  gender?: Gender;
  page?: number;
  limit?: number;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// API Error type
export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
}
