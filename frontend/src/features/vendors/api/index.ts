import { 
  Vendor, 
  VendorBill, 
  VendorPayment, 
  VendorSummary,
  CreateVendorData,
  CreateVendorBillData,
  CreateVendorPaymentData
} from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
const API_URL = `${API_BASE_URL}/api/vendors`;
const VENDOR_BILLS_URL = `${API_BASE_URL}/api/vendor-bills`;
const VENDOR_PAYMENTS_URL = `${API_BASE_URL}/api/vendor-payments`;

// Vendor CRUD operations
export const fetchVendors = async (name?: string): Promise<Vendor[]> => {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  
  const response = await fetch(`${API_URL}?${params}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendors');
  }
  
  const data = await response.json();
  return data.data;
};

export const getVendorById = async (id: number): Promise<Vendor> => {
  const response = await fetch(`${API_URL}/${id}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendor');
  }
  
  const data = await response.json();
  return data.data;
};

export const createVendor = async (vendorData: CreateVendorData): Promise<Vendor> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(vendorData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create vendor');
  }
  
  const data = await response.json();
  return data.data;
};

export const updateVendor = async (id: number, vendorData: Partial<CreateVendorData>): Promise<Vendor> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(vendorData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update vendor');
  }
  
  const data = await response.json();
  return data.data;
};

export const deleteVendor = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete vendor');
  }
};

export const getVendorSummary = async (id: number): Promise<VendorSummary> => {
  const response = await fetch(`${API_URL}/${id}/summary`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendor summary');
  }
  
  const data = await response.json();
  return data.data;
};

// Vendor Bills operations
export const fetchVendorBills = async (vendorId?: number, name?: string, fromDate?: string, toDate?: string): Promise<VendorBill[]> => {
  const params = new URLSearchParams();
  if (vendorId) params.append('vendorId', vendorId.toString());
  if (name) params.append('name', name);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const response = await fetch(`${VENDOR_BILLS_URL}?${params}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendor bills');
  }
  
  const data = await response.json();
  return data.data;
};

export const createVendorBill = async (billData: CreateVendorBillData): Promise<VendorBill> => {
  const response = await fetch(VENDOR_BILLS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(billData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create vendor bill');
  }
  
  const data = await response.json();
  return data.data;
};

export const updateVendorBill = async (id: number, billData: Partial<CreateVendorBillData>): Promise<VendorBill> => {
  const response = await fetch(`${VENDOR_BILLS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(billData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update vendor bill');
  }
  
  const data = await response.json();
  return data.data;
};

export const deleteVendorBill = async (id: number): Promise<void> => {
  const response = await fetch(`${VENDOR_BILLS_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete vendor bill');
  }
};

// Vendor Payments operations
export const fetchVendorPayments = async (vendorId?: number, fromDate?: string, toDate?: string): Promise<VendorPayment[]> => {
  const params = new URLSearchParams();
  if (vendorId) params.append('vendorId', vendorId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const response = await fetch(`${VENDOR_PAYMENTS_URL}?${params}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendor payments');
  }
  
  const data = await response.json();
  return data.data;
};

export const getVendorPaymentHistory = async (vendorId: number): Promise<VendorPayment[]> => {
  const response = await fetch(`${VENDOR_PAYMENTS_URL}/vendor/${vendorId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vendor payment history');
  }
  
  const data = await response.json();
  return data.data;
};

export const createVendorPayment = async (paymentData: CreateVendorPaymentData): Promise<{ vendorPayment: VendorPayment; expense: any }> => {
  const response = await fetch(VENDOR_PAYMENTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create vendor payment');
  }
  
  const data = await response.json();
  return data.data;
};

export const updateVendorPayment = async (id: number, paymentData: Partial<CreateVendorPaymentData>): Promise<VendorPayment> => {
  const response = await fetch(`${VENDOR_PAYMENTS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update vendor payment');
  }
  
  const data = await response.json();
  return data.data;
};

export const deleteVendorPayment = async (id: number): Promise<void> => {
  const response = await fetch(`${VENDOR_PAYMENTS_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete vendor payment');
  }
};
