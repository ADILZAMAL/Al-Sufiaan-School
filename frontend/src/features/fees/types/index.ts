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

// Fee Head Types
export interface FeeHead {
  id: number;
  schoolId: number;
  name: string;
  description: string | null;
  frequency: 'MONTHLY' | 'ONE_TIME';
  pricingType: 'FLAT' | 'PER_CLASS' | 'AREA_BASED' | 'CUSTOM';
  applicability: 'AUTO' | 'OPT_IN';
  flatAmount: number | null;
  isActive: boolean;
  displayOrder: number;
  legacyType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeeHeadClassPricingItem {
  id: number;
  feeHeadId: number;
  classId: number;
  schoolId: number;
  amount: number;
  isActive: boolean;
  class?: { id: number; name: string };
}

export interface CreateFeeHeadRequest {
  name: string;
  description?: string;
  frequency: 'MONTHLY' | 'ONE_TIME';
  pricingType: 'FLAT' | 'PER_CLASS' | 'AREA_BASED' | 'CUSTOM';
  applicability: 'AUTO' | 'OPT_IN';
  flatAmount?: number;
  displayOrder?: number;
}

export interface UpdateFeeHeadRequest {
  name?: string;
  description?: string;
  frequency?: 'MONTHLY' | 'ONE_TIME';
  pricingType?: 'FLAT' | 'PER_CLASS' | 'AREA_BASED' | 'CUSTOM';
  applicability?: 'AUTO' | 'OPT_IN';
  flatAmount?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export interface BulkUpsertClassPricingRequest {
  pricingData: Array<{ classId: number; amount: number }>;
}

export interface FeeHeadResponse {
  success: boolean;
  data: FeeHead | FeeHead[];
  message: string;
}

export interface FeeHeadClassPricingResponse {
  success: boolean;
  data: FeeHeadClassPricingItem[];
  message: string;
}

export interface FeeHeadBulkUpsertResponse {
  success: boolean;
  data: Array<{ action: 'created' | 'updated'; classId: number }>;
  message: string;
}

