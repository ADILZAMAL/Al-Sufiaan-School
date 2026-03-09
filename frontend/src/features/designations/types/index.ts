export interface Designation {
  id: number;
  name: string;
  description: string | null;
  schoolId: number;
  isActive: boolean;
  staffCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignationRequest {
  name: string;
  description?: string;
}

export interface UpdateDesignationRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}
