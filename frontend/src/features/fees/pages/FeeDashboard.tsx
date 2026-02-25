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
import { FiTrendingUp, FiCheckCircle, FiAlertCircle, FiPercent } from 'react-icons/fi';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatMonthYear = (month: number, year: number) =>
  `${MONTH_NAMES[month]} ${year}`;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const fullMonth = payload[0]?.payload?.fullMonth ?? label;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[200px]">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{fullMonth}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 mb-1.5">
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.fill }} />
            {entry.name}
          </span>
          <span className="text-sm font-semibold text-gray-800">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  sub?: string;
}
const StatCard = ({ icon, label, value, iconBg, iconColor, sub }: StatCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <span className={`text-xl ${iconColor}`}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const totalGenerated = monthlyStats.reduce((s, m) => s + m.totalGenerated, 0);
  const totalCollected = monthlyStats.reduce((s, m) => s + m.totalCollected, 0);
  const totalDue = monthlyStats.reduce((s, m) => s + m.totalDue, 0);
  const overallRate = totalGenerated > 0
    ? ((totalCollected / totalGenerated) * 100).toFixed(1)
    : '0.0';

  // ── Chart data (oldest → newest) ────────────────────────────────────────────
  const chartData = [...monthlyStats].reverse().map((stat) => ({
    month: `${MONTH_NAMES[stat.month].substring(0, 3)} '${stat.calendarYear.toString().slice(-2)}`,
    fullMonth: formatMonthYear(stat.month, stat.calendarYear),
    Generated: stat.totalGenerated,
    Collected: stat.totalCollected,
    Due: stat.totalDue,
  }));

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
          <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="text-red-500 text-xl" />
            </div>
            <p className="text-gray-700 font-medium mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fee Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monthly fee statistics — last 12 months</p>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FiTrendingUp />}
            label="Total Generated"
            value={formatCurrency(totalGenerated)}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            sub="Last 12 months"
          />
          <StatCard
            icon={<FiCheckCircle />}
            label="Total Collected"
            value={formatCurrency(totalCollected)}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            sub="Last 12 months"
          />
          <StatCard
            icon={<FiAlertCircle />}
            label="Total Due"
            value={formatCurrency(totalDue)}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            sub="Outstanding"
          />
          <StatCard
            icon={<FiPercent />}
            label="Collection Rate"
            value={`${overallRate}%`}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            sub="Overall average"
          />
        </div>

        {/* ── Bar chart ── */}
        {monthlyStats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-800 mb-1">Fee Overview</p>
            <p className="text-xs text-gray-400 mb-5">Generated vs Collected vs Due per month</p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
                barCategoryGap="30%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => {
                    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
                    return `₹${v}`;
                  }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Generated" fill="#3b82f6" name="Generated" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Due" fill="#f87171" name="Due" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Monthly breakdown table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Monthly Breakdown</p>
          </div>

          {monthlyStats.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No fee data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Month / Year
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Collected
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Collection Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyStats.map((stat) => {
                    const rate = stat.totalGenerated > 0
                      ? (stat.totalCollected / stat.totalGenerated) * 100
                      : 0;
                    const rateStr = rate.toFixed(1);
                    const rateColor =
                      rate >= 90 ? 'bg-emerald-500' : rate >= 50 ? 'bg-yellow-400' : 'bg-red-400';
                    const rateBadge =
                      rate >= 90
                        ? 'text-emerald-700 bg-emerald-50'
                        : rate >= 50
                        ? 'text-yellow-700 bg-yellow-50'
                        : 'text-red-700 bg-red-50';

                    return (
                      <tr
                        key={`${stat.calendarYear}-${stat.month}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">
                            {formatMonthYear(stat.month, stat.calendarYear)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-700">{formatCurrency(stat.totalGenerated)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(stat.totalCollected)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span
                            className={`text-sm font-semibold ${
                              stat.totalDue > 0 ? 'text-red-500' : 'text-gray-400'
                            }`}
                          >
                            {formatCurrency(stat.totalDue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${rateColor}`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rateBadge}`}
                            >
                              {rateStr}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
