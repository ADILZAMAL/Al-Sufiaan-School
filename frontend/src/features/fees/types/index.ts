// Fee Category Types
export interface FeeCategory {
  id: number;
  name: string;
  pricingType: 'Fixed' | 'Class-based' | 'Area-based';
  fixedAmount: number;
  feeType: 'One-time' | 'Annual' | 'Monthly' | 'Quarterly';
  isRefundable: boolean;
  isMandatory: boolean;
  displayOrder: number;
  isActive: boolean;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

// Form data for creating/updating fee categories
export interface FeeCategoryFormData {
  name: string;
  pricingType: 'Fixed' | 'Class-based' | 'Area-based';
  fixedAmount?: number;
  feeType: 'One-time' | 'Annual' | 'Monthly' | 'Quarterly';
  isRefundable?: boolean;
  isMandatory?: boolean;
  displayOrder?: number;
}

// API Response types
export interface FeeCategoryResponse {
  success: boolean;
  message: string;
  data: FeeCategory;
}

export interface FeeCategoriesResponse {
  success: boolean;
  message: string;
  data: FeeCategory[];
}

// Filter options for fee categories
export interface FeeCategoryFilters {
  isActive?: boolean;
  feeType?: 'One-time' | 'Annual' | 'Monthly' | 'Quarterly';
  pricingType?: 'Fixed' | 'Class-based' | 'Area-based';
}

// Reorder data
export interface CategoryOrder {
  id: number;
  displayOrder: number;
}

export interface ReorderRequest {
  categoryOrders: CategoryOrder[];
}

// Constants
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

export const FEE_TYPE_COLORS = {
  'One-time': 'bg-blue-100 text-blue-800',
  'Annual': 'bg-green-100 text-green-800',
  'Monthly': 'bg-yellow-100 text-yellow-800',
  'Quarterly': 'bg-purple-100 text-purple-800'
} as const;

export const PRICING_TYPE_COLORS = {
  'Fixed': 'bg-gray-100 text-gray-800',
  'Class-based': 'bg-indigo-100 text-indigo-800',
  'Area-based': 'bg-pink-100 text-pink-800'
} as const;
