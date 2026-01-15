import {
  Student,
  StudentListResponse,
  StudentResponse,
  CreateStudentRequest,
  StudentFilters,
  UpdateStudentRequest,
  UpdatePaymentReminderRequest,
  RegenerateMonthlyFeeRequest
} from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

// Base API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json();
  
  if (!body.success) {
    throw new Error(body.message || 'API request failed');
  }
  
  return body;
};

export const studentApi = {
  // Get all students with filters
  getStudents: async (filters: StudentFilters = {}): Promise<Student[]> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.classId) params.append('classId', filters.classId.toString());
    if (filters.sectionId) params.append('sectionId', filters.sectionId.toString());
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const body = await apiRequest(`/students?${params.toString()}`);
    return body.data;
  },

  // Get a single student by ID
  getStudent: async (id: number): Promise<StudentResponse> => {
    return await apiRequest(`/students/${id}`);
  },

  // Create a new student
  createStudent: async (studentData: CreateStudentRequest): Promise<StudentResponse> => {
    return await apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  // Update an existing student
  updateStudent: async (id: number, studentData: UpdateStudentRequest): Promise<StudentResponse> => {
    return await apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  // Delete a student
  deleteStudent: async (id: number): Promise<{ success: boolean; message: string }> => {
    return await apiRequest(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Get students by class
  getStudentsByClass: async (classId: number): Promise<StudentListResponse> => {
    return await apiRequest(`/students/by-class/${classId}`);
  },

  // Get students by section
  getStudentsBySection: async (sectionId: number): Promise<StudentListResponse> => {
    return await apiRequest(`/students/by-section/${sectionId}`);
  },

  // Search students
  searchStudents: async (query: string): Promise<StudentListResponse> => {
    return await apiRequest(`/students/search?q=${encodeURIComponent(query)}`);
  },

  // Get student statistics
  getStudentStats: async (): Promise<{
    success: boolean;
    data: {
      total: number;
      active: number;
      inactive: number;
      graduated: number;
      transferred: number;
      byClass: Array<{ classId: number; className: string; count: number }>;
      byGender: Array<{ gender: string; count: number }>;
    };
  }> => {
    return await apiRequest('/students/stats');
  },

  // Validate admission number
  validateAdmissionNo: async (admissionNo: string, excludeId?: number): Promise<{
    success: boolean;
    available: boolean;
    message: string;
  }> => {
    const params = new URLSearchParams({ admissionNo });
    if (excludeId) params.append('excludeId', excludeId.toString());
    
    return await apiRequest(`/students/validate-admission-no?${params.toString()}`);
  },

  // Get next admission number
  getNextAdmissionNo: async (): Promise<{
    success: boolean;
    admissionNo: string;
  }> => {
    return await apiRequest('/students/next-admission-no');
  },

  // Promote students to next class
  promoteStudents: async (studentIds: number[], targetClassId: number, targetSectionId?: number): Promise<{
    success: boolean;
    message: string;
    promoted: number;
    failed: number;
  }> => {
    return await apiRequest('/students/promote', {
      method: 'POST',
      body: JSON.stringify({
        studentIds,
        targetClassId,
        targetSectionId
      }),
    });
  },

  // Update student status (batch update)
  updateStudentStatus: async (studentIds: number[], status: string): Promise<{
    success: boolean;
    message: string;
    updated: number;
    failed: number;
  }> => {
    return await apiRequest('/students/status', {
      method: 'PATCH',
      body: JSON.stringify({
        studentIds,
        status
      }),
    });
  },

  // Export students data
  exportStudents: async (filters: StudentFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.classId) params.append('classId', filters.classId.toString());
    if (filters.sectionId) params.append('sectionId', filters.sectionId.toString());
    if (filters.gender) params.append('gender', filters.gender);

    const response = await fetch(`${API_BASE_URL}/api/students/export?${params.toString()}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export students');
    }

    return await response.blob();
  },

  // Import students from CSV/Excel
  importStudents: async (file: File): Promise<{
    success: boolean;
    message: string;
    imported: number;
    failed: number;
    errors?: Array<{ row: number; field: string; message: string }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/students/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to import students');
    }

    return await response.json();
  },

  // Get student fee timeline
  getStudentFeeTimeline: async (studentId: number): Promise<{
    success: boolean;
    data: Array<{
      month: number;
      calendarYear: number;
      label: string;
      status: 'not_generated' | 'unpaid' | 'partial' | 'paid';
      monthlyFeeId?: number;
      totalConfiguredAmount?: number;
      totalAdjustment?: number;
      totalPayableAmount?: number;
      paidAmount?: number;
      dueAmount?: number;
      discountReason?: string | null;
      feeItems?: Array<{
        feeType: string;
        amount: number;
      }> | null;
      payments?: Array<{
        id: number;
        amountPaid: number;
        paymentDate: Date;
        paymentMode: string;
        referenceNumber: string | null;
        remarks: string | null;
        receivedBy: string | null;
      }>;
    }>;
  }> => {
    return await apiRequest(`/students/${studentId}/fees/timeline`);
  },

  // Generate monthly fee for a student
  generateMonthlyFee: async (studentId: number, feeData: {
    month: number;
    calendarYear: number;
    hostel?: boolean;
    newAdmission?: boolean;
    transportationAreaId?: number;
    discount?: number;
    discountReason?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    return await apiRequest(`/students/${studentId}/fees/generate`, {
      method: 'POST',
      body: JSON.stringify(feeData),
    });
  },

  // Collect fee payment for a student
  collectFeePayment: async (studentId: number, monthlyFeeId: number, paymentData: {
    amountPaid: number;
    paymentMode: string;
    referenceNumber?: string;
    remarks?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    return await apiRequest(`/students/${studentId}/fees/${monthlyFeeId}/collect`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Regenerate monthly fee for a student
  regenerateMonthlyFee: async (studentId: number, monthlyFeeId: number, feeData: RegenerateMonthlyFeeRequest): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    return await apiRequest(`/students/${studentId}/fees/${monthlyFeeId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify(feeData),
    });
  },

  // Get students with payment reminders
  getStudentsWithPaymentReminders: async (): Promise<Student[]> => {
    const body = await apiRequest('/students/payment-reminders');
    return body.data;
  },

  // Update payment reminder for a student
  updatePaymentReminder: async (studentId: number, reminderData: {
    paymentReminderDate?: string | null;
    paymentRemainderRemarks?: string | null;
  }): Promise<StudentResponse> => {
    return await apiRequest(`/students/${studentId}/payment-reminder`, {
      method: 'PATCH',
      body: JSON.stringify(reminderData),
    });
  }
};

// Export individual functions for convenience
export const getStudents = studentApi.getStudents;
export const getStudentById = async (id: number): Promise<Student> => {
  const response = await studentApi.getStudent(id);
  return response.data as Student;
};
export const createStudent = studentApi.createStudent;
export const updateStudent = studentApi.updateStudent;
export const deleteStudent = studentApi.deleteStudent;
export const getStudentFeeTimeline = studentApi.getStudentFeeTimeline;
export const generateMonthlyFee = studentApi.generateMonthlyFee;
export const collectFeePayment = studentApi.collectFeePayment;
export const regenerateMonthlyFee = studentApi.regenerateMonthlyFee;
export const getStudentsWithPaymentReminders = studentApi.getStudentsWithPaymentReminders;
export const updatePaymentReminder = studentApi.updatePaymentReminder;
