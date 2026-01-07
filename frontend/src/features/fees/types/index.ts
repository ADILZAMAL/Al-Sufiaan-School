// Constants for form options
export const FEE_TYPES = [
  { value: 'One-time', label: 'One-time' },
  { value: 'Annual', label: 'Annual' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' }
] as const;

export const PRICING_TYPES = [
  { value: 'Fixed', label: 'Fixed Amount' },
  { value: 'Class-based', label: 'Class-based Pricing' },
  { value: 'Area-based', label: 'Area-based Pricing' }
] as const;

// Color constants for UI styling
export const FEE_TYPE_COLORS = {
  'One-time': 'bg-purple-100 text-purple-800',
  'Annual': 'bg-blue-100 text-blue-800',
  'Monthly': 'bg-green-100 text-green-800',
  'Quarterly': 'bg-yellow-100 text-yellow-800'
} as const;

export const PRICING_TYPE_COLORS = {
  'Fixed': 'bg-gray-100 text-gray-800',
  'Class-based': 'bg-indigo-100 text-indigo-800',
  'Area-based': 'bg-orange-100 text-orange-800'
} as const;

// Class Fee Pricing Types
export interface ClassFeePricing {
  id: number;
  classId: number;
  amount: number;
  academicYear: string;
  isActive: boolean;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
  
  // Associated data
  class?: {
    id: number;
    name: string;
  };
}

// Class Types
export interface Class {
  id: number;
  name: string;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

// API Request Types
export interface CreateClassFeePricingRequest {
  classId: number;
  amount: number;
  academicYear: string;
}

export interface UpdateClassFeePricingRequest {
  amount?: number;
  academicYear?: string;
  isActive?: boolean;
}

export interface BulkUpsertClassFeePricingRequest {
  pricingData: CreateClassFeePricingRequest[];
}

export interface CopyPricingRequest {
  fromYear: string;
  toYear: string;
  classIds?: number[];
}

// API Response Types
export interface ClassFeePricingResponse {
  success: boolean;
  data: ClassFeePricing | ClassFeePricing[];
  message: string;
}

export interface ClassFeePricingByClassResponse {
  success: boolean;
  data: {
    classFeePricing: ClassFeePricing[];
    totalAmount: number;
    classId: number;
    academicYear: string;
  };
  message: string;
}

export interface BulkOperationResponse {
  success: boolean;
  data: Array<{
    action: 'created' | 'updated';
    id: number;
  }>;
  message: string;
}

export interface CopyPricingResponse {
  success: boolean;
  data: {
    copiedCount: number;
    fromYear: string;
    toYear: string;
  };
  message: string;
}

// Form Types
export interface ClassFeePricingFormData {
  classId: string;
  amount: string;
  academicYear: string;
}

export interface ClassFeePricingFilters {
  classId?: number;
  academicYear?: string;
  isActive?: boolean;
}

// Table/Display Types
export interface ClassFeePricingTableRow extends ClassFeePricing {
  className: string;
  feeType: string;
}

export interface ClassFeeSummary {
  classId: number;
  className: string;
  academicYear: string;
  totalFees: number;
  mandatoryFees: number;
  optionalFees: number;
  feeCount: number;
}

// Academic Year Types
export interface AcademicYear {
  value: string;
  label: string;
  isActive: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Utility Types
export type ClassFeePricingStatus = 'active' | 'inactive' | 'expired';

export interface ClassFeePricingStats {
  totalClasses: number;
  totalPricingRecords: number;
  averageFeePerClass: number;
  academicYears: string[];
}

// Component Props Types
export interface ClassFeePricingTableProps {
  data: ClassFeePricing[];
  loading?: boolean;
  onEdit?: (pricing: ClassFeePricing) => void;
  onDelete?: (id: number) => void;
  onView?: (pricing: ClassFeePricing) => void;
}

export interface ClassFeePricingFormProps {
  initialData?: ClassFeePricing;
  onSubmit: (data: CreateClassFeePricingRequest | UpdateClassFeePricingRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export interface ClassFeePricingFiltersProps {
  filters: ClassFeePricingFilters;
  onFiltersChange: (filters: ClassFeePricingFilters) => void;
  classes: Class[];
  academicYears: AcademicYear[];
}
