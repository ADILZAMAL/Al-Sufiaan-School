// Transportation Area Pricing Types
export interface TransportationAreaPricing {
  id: number;
  areaName: string;
  price: number;
  feeCategoryId: number;
  academicYear: string;
  isActive: boolean;
  schoolId: number;
  description?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  
  // Associated data
  feeCategory?: {
    id: number;
    name: string;
    feeType: string;
    pricingType: string;
    isMandatory: boolean;
    displayOrder?: number;
  };
}

// API Request Types
export interface CreateTransportationAreaPricingRequest {
  areaName: string;
  price: number;
  feeCategoryId: number;
  academicYear: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateTransportationAreaPricingRequest {
  areaName?: string;
  price?: number;
  feeCategoryId?: number;
  academicYear?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface BulkUpsertTransportationAreaPricingRequest {
  pricingData: CreateTransportationAreaPricingRequest[];
}

export interface CopyTransportationPricingRequest {
  fromYear: string;
  toYear: string;
  areaNames?: string[];
}

// API Response Types
export interface TransportationAreaPricingResponse {
  success: boolean;
  data: TransportationAreaPricing | TransportationAreaPricing[];
  message: string;
}

export interface TransportationAreaPricingByAreaResponse {
  success: boolean;
  data: {
    transportationAreaPricing: TransportationAreaPricing[];
    totalAmount: number;
    areaName: string;
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

export interface TransportationAreaPricingStatsResponse {
  success: boolean;
  data: {
    totalRecords: number;
    activeRecords: number;
    uniqueAreas: number;
    averagePrice: number;
    academicYears: string[];
  };
  message: string;
}

// Form Types
export interface TransportationAreaPricingFormData {
  areaName: string;
  price: string;
  feeCategoryId: string;
  academicYear: string;
  description: string;
  displayOrder: string;
}

export interface TransportationAreaPricingFilters {
  academicYear?: string;
  feeCategoryId?: number;
  areaName?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Table/Display Types
export interface TransportationAreaPricingTableRow extends TransportationAreaPricing {
  feeCategoryName: string;
  feeType: string;
  isMandatory: boolean;
}

export interface TransportationAreaSummary {
  areaName: string;
  academicYear: string;
  totalFees: number;
  feeCount: number;
  averagePrice: number;
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
export type TransportationAreaPricingStatus = 'active' | 'inactive' | 'expired';

export interface TransportationAreaPricingStats {
  totalAreas: number;
  totalFeeCategories: number;
  totalPricingRecords: number;
  averagePricePerArea: number;
  academicYears: string[];
}

// Component Props Types
export interface TransportationAreaPricingTableProps {
  data: TransportationAreaPricing[];
  loading?: boolean;
  onEdit?: (pricing: TransportationAreaPricing) => void;
  onDelete?: (id: number) => void;
  onView?: (pricing: TransportationAreaPricing) => void;
}

export interface TransportationAreaPricingFormProps {
  initialData?: TransportationAreaPricing;
  onSubmit: (data: CreateTransportationAreaPricingRequest | UpdateTransportationAreaPricingRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export interface TransportationAreaPricingFiltersProps {
  filters: TransportationAreaPricingFilters;
  onFiltersChange: (filters: TransportationAreaPricingFilters) => void;
  feeCategories: Array<{
    id: number;
    name: string;
    feeType: string;
  }>;
  academicYears: AcademicYear[];
}

// Pagination Types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface TransportationAreaPricingListResponse {
  success: boolean;
  data: {
    transportationAreaPricing: TransportationAreaPricing[];
    pagination: PaginationInfo;
  };
  message: string;
}
