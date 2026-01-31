const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export type MonthlyFeeStats = {
  month: number;
  calendarYear: number;
  totalGenerated: number;
  totalCollected: number;
  totalDue: number;
};

export type FeeDashboardResponse = {
  success: boolean;
  message: string;
  data: MonthlyFeeStats[];
};

export const fetchFeeDashboard = async (): Promise<MonthlyFeeStats[]> => {
  const response = await fetch(`${API_BASE_URL}/api/fees/dashboard`, {
    credentials: "include",
  });
  
  const body: FeeDashboardResponse = await response.json();
  
  if (!body.success) {
    throw new Error(body.message || 'Failed to fetch fee dashboard data');
  }
  
  return body.data;
};
