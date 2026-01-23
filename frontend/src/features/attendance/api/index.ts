// Attendance API
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

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

export interface AttendanceRecord {
  id: number;
  studentId: number;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  markedBy: number;
  schoolId: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    rollNumber: string;
  };
  markedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceStats {
  date: string;
  presentCount: number;
  absentCount: number;
  totalMarked: number;
  totalStudents: number;
  attendancePercentage: number;
  holidayCount: number;
  isHoliday: boolean;
  holidayName: string | null;
  notMarked: number;
}

export interface StudentWithAttendance {
  id: number;
  firstName: string;
  lastName: string;
  rollNumber: string;
  classId: number;
  sectionId: number;
  class?: { id: number; name: string };
  section?: { id: number; name: string };
  attendance?: {
    id: number;
    status: 'PRESENT' | 'ABSENT';
    remarks: string | null;
  };
  daysAbsentSinceLastPresent: number | null;
}

export interface AttendanceCalendarRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  remarks?: string;
  name?: string;
  reason?: string;
}

export interface StudentAttendanceCalendar {
  studentId: number;
  studentName: string;
  class?: string;
  section?: string;
  attendanceRecords: AttendanceCalendarRecord[];
  summary: {
    totalPresent: number;
    totalAbsent: number;
    totalHolidays: number;
    totalWorkingDays: number;
    attendancePercentage: number;
  };
}

export interface MarkAttendanceRequest {
  date: string;
  attendances: Array<{
    studentId: number;
    status: 'PRESENT' | 'ABSENT';
    remarks?: string;
  }>;
}

export const attendanceApi = {
  // Get all attendance statistics for all classes/sections at once
  getAllAttendanceStats: async (params: {
    date: string;
  }): Promise<{
    date: string;
    classStats: Array<{
      classId: number;
      className: string;
      sectionId: number;
      sectionName: string;
      date: string;
      presentCount: number;
      absentCount: number;
      totalMarked: number;
      totalStudents: number;
      attendancePercentage: number;
      notMarked: number;
      isHoliday: boolean;
      holidayName: string | null;
    }>;
    isHoliday: boolean;
    holidayName: string | null;
  }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', params.date);

    const response = await apiRequest(`/attendance/stats/all?${queryParams.toString()}`);
    return response.data;
  },

  // Bulk mark attendance
  markAttendance: async (data: MarkAttendanceRequest) => {
    return await apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get attendance records with filters
  getAttendance: async (params: {
    date?: string;
    classId?: number;
    sectionId?: number;
    studentId?: number;
  } = {}): Promise<AttendanceRecord[]> => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.classId) queryParams.append('classId', params.classId.toString());
    if (params.sectionId) queryParams.append('sectionId', params.sectionId.toString());
    if (params.studentId) queryParams.append('studentId', params.studentId.toString());

    const body = await apiRequest(`/attendance?${queryParams.toString()}`);
    return body.data;
  },

  // Get single attendance record
  getAttendanceById: async (id: number): Promise<AttendanceRecord> => {
    return await apiRequest(`/attendance/${id}`);
  },

  // Update attendance record
  updateAttendance: async (id: number, data: {
    status?: 'PRESENT' | 'ABSENT';
    remarks?: string;
  }) => {
    return await apiRequest(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get attendance statistics
  getAttendanceStats: async (params: {
    date: string;
    classId?: number;
    sectionId?: number;
  }): Promise<AttendanceStats> => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', params.date);
    if (params.classId) queryParams.append('classId', params.classId.toString());
    if (params.sectionId) queryParams.append('sectionId', params.sectionId.toString());

    const response = await apiRequest(`/attendance/stats?${queryParams.toString()}`);
    return response.data;
  },

  // Get students with attendance status for a class/section
  getStudentsWithAttendance: async (
    classId: number,
    sectionId: number,
    date: string
  ): Promise<StudentWithAttendance[]> => {
    return await apiRequest(`/attendance/students/${classId}/${sectionId}?date=${date}`);
  },

  // Get student's attendance calendar
  getStudentCalendar: async (studentId: number): Promise<StudentAttendanceCalendar> => {
    const response = await apiRequest(`/attendance/calendar/${studentId}`);
    return response.data;
  },
};

export const markAttendance = attendanceApi.markAttendance;
export const getAttendance = attendanceApi.getAttendance;
export const getAttendanceStats = attendanceApi.getAttendanceStats;
export const getAllAttendanceStats = attendanceApi.getAllAttendanceStats;
export const getStudentsWithAttendance = attendanceApi.getStudentsWithAttendance;
export const getStudentCalendar = attendanceApi.getStudentCalendar;
