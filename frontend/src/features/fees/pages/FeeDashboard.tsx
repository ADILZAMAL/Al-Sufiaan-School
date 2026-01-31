import { useEffect, useState } from 'react';
import { fetchFeeDashboard, MonthlyFeeStats } from '../api/feeDashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FeeDashboard() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyFeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFeeDashboard();
      setMonthlyStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonthYear = (month: number, year: number) => {
    return `${MONTH_NAMES[month]} ${year}`;
  };

  // Prepare chart data - reverse to show oldest to newest (left to right)
  const chartData = monthlyStats
    .slice()
    .reverse()
    .map((stat) => ({
      month: `${MONTH_NAMES[stat.month].substring(0, 3)} ${stat.calendarYear.toString().slice(-2)}`,
      fullMonth: formatMonthYear(stat.month, stat.calendarYear),
      Generated: stat.totalGenerated,
      Collected: stat.totalCollected,
      Due: stat.totalDue,
    }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fee Dashboard</h1>
        <p className="text-gray-600 mt-1">Monthly fee statistics for the last 12 months</p>
      </div>

      {/* Chart */}
      {!loading && !error && monthlyStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Fee Overview - Generated vs Collected vs Due</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
                  return `₹${value}`;
                }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullMonth;
                  }
                  return label;
                }}
              />
              <Legend />
              <Bar dataKey="Generated" fill="#3b82f6" name="Generated" />
              <Bar dataKey="Collected" fill="#10b981" name="Collected" />
              <Bar dataKey="Due" fill="#ef4444" name="Due" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Statistics Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Loading dashboard data...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={loadDashboardData}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : monthlyStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No fee data available</p>
                  </td>
                </tr>
              ) : (
                monthlyStats.map((stat, _) => {
                  const collectionRate = stat.totalGenerated > 0
                    ? ((stat.totalCollected / stat.totalGenerated) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <tr key={`${stat.calendarYear}-${stat.month}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatMonthYear(stat.month, stat.calendarYear)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(stat.totalGenerated)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(stat.totalCollected)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${stat.totalDue > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {formatCurrency(stat.totalDue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 mr-2">
                            {collectionRate}%
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                parseFloat(collectionRate) >= 90
                                  ? 'bg-green-600'
                                  : parseFloat(collectionRate) >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(parseFloat(collectionRate), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
