const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export type StudentWithDue = {
  studentId: number;
  monthlyFeeId: number;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    email?: string;
    phone: string;
    studentPhoto?: string;
    classId?: number;
    class?: {
      id: number;
      name: string;
    };
  };
  totalPayableAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
};

export type StudentsWithDuesResponse = {
  success: boolean;
  message: string;
  data: StudentWithDue[];
};

export const fetchStudentsWithDues = async (
  month: number,
  calendarYear: number
): Promise<StudentWithDue[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/fees/students-with-dues?month=${month}&calendarYear=${calendarYear}`,
    {
      credentials: "include",
    }
  );

  const body: StudentsWithDuesResponse = await response.json();

  if (!body.success) {
    throw new Error(body.message || "Failed to fetch students with dues");
  }

  return body.data;
};
