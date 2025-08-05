export interface Payslip {
  id?: number;
  payslipNumber: string;
  staffId: number;
  staffType: 'teaching' | 'non-teaching';
  month: number;
  year: number;
  monthName: string;
  
  // Staff Details (snapshot)
  staffName: string;
  staffEmail: string;
  staffMobile: string;
  staffRole: string;
  staffAadhaar: string;
  staffAccountNumber?: string;
  staffIfscCode?: string;
  
  // School Details (snapshot)
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  
  // Salary Calculation
  baseSalary: number;
  perDaySalary: number;
  workingDays: number;
  totalDays: number;
  presentDays: number;
  effectiveSalaryDays: number;
  absentDays: number;
  casualLeave: number;
  halfDays: number;
  
  // Financial Calculation
  grossSalary: number;
  deductions: number;
  netSalary: number;
  
  // Payment Tracking
  totalPaidAmount: number;
  remainingAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  lastPaymentDate?: string;
  
  // Audit Information
  generatedBy: number;
  generatedDate: string;
  schoolId: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface PayslipFormData {
  staffId: number;
  staffType: 'teaching' | 'non-teaching';
  month: number;
  year: number;
  workingDays: number | string;
  absentDays: number | string;
  casualLeave: number | string;
  halfDays: number | string;
  deductions: number | string;
}

export interface PayslipFormErrors {
  [key: string]: string;
}

export interface PayslipCalculation {
  baseSalary: number;
  perDaySalary: number;
  totalDays: number;
  presentDays: number;
  grossSalary: number;
  netSalary: number;
}

export interface PayslipListResponse {
  payslips: Payslip[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PayslipExistsResponse {
  exists: boolean;
  payslip?: Payslip;
}

export interface PayslipPayment {
  id: number;
  payslipId: number;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
  notes?: string;
  paidBy: number;
  expenseId: number;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
  
  // Associated data
  paidByUser?: {
    id: number;
    name: string;
    email: string;
  };
  expense?: {
    id: number;
    name: string;
    amount: number;
  };
}

export interface PayslipWithPayments extends Payslip {
  payments?: PayslipPayment[];
}

export interface PaymentFormData {
  paymentAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
  notes?: string;
}

export interface PaymentFormErrors {
  [key: string]: string;
}

export interface PaymentResponse {
  payslip: PayslipWithPayments;
  payment: PayslipPayment;
  expense: {
    id: number;
    name: string;
    amount: number;
  };
}

export const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' }
] as const;

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

export const YEARS = Array.from({ length: 31 }, (_, i) => {
  const year = 2020 + i;
  return { value: year, label: year.toString() };
});
