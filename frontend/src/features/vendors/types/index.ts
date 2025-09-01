export interface Vendor {
  id: number;
  name: string;
  mobile: string;
  upiNumberId?: string;
  accountNumber?: string;
  ifscCode?: string;
  address?: string;
  categoryId: number;
  schoolId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface VendorBill {
  id: number;
  amount: number;
  name: string;
  vendorId: number;
  userId: number;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: number;
    name: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface VendorPayment {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  vendorId: number;
  userId: number;
  schoolId: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: number;
    name: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface VendorSummary {
  totalBills: number;
  totalPayments: number;
  dueAmount: number;
  status: 'pending' | 'partial' | 'paid';
}

export interface CreateVendorData {
  name: string;
  mobile: string;
  upiNumberId?: string;
  accountNumber?: string;
  ifscCode?: string;
  address?: string;
  categoryId: number;
}

export interface CreateVendorBillData {
  amount: number;
  name: string;
  vendorId: number;
}

export interface CreateVendorPaymentData {
  amount: number;
  paymentMethod: string;
  vendorId: number;
  paymentDate?: string;
  notes?: string;
}
