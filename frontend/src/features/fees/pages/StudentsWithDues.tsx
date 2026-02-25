import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { fetchStudentsWithDues, StudentWithDue } from '../api/studentsWithDues';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDollarSign,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

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

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-100 last:border-0 mx-6 animate-pulse">
            <div className="flex items-center gap-4 h-full">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-50 text-emerald-700',
    PARTIAL: 'bg-amber-50 text-amber-700',
    PENDING: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentsWithDues: React.FC = () => {
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: ['studentsWithDues', selectedMonth, selectedYear],
    queryFn: () => fetchStudentsWithDues(selectedMonth, selectedYear),
    enabled: !!selectedMonth && !!selectedYear,
  });

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    if (newYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  };

  const handleMonthChange = (newMonth: number) => {
    if (selectedYear === currentYear && newMonth > currentMonth) return;
    setSelectedMonth(newMonth);
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i).reverse();

  const availableMonths = selectedYear === currentYear
    ? MONTH_NAMES.slice(1, currentMonth + 1).map((month, i) => ({ value: i + 1, label: month }))
    : MONTH_NAMES.slice(1).map((month, i) => ({ value: i + 1, label: month }));

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const totalDue = students.reduce((s, st) => s + st.dueAmount, 0);
  const totalPaid = students.reduce((s, st) => s + st.paidAmount, 0);
  const totalPayable = students.reduce((s, st) => s + st.totalPayableAmount, 0);
  const partialCount = students.filter(s => s.status === 'PARTIAL').length;
  const pendingCount = students.filter(s => s.status === 'PENDING').length;

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.student.firstName} ${s.student.lastName}`.toLowerCase();
      const adm = s.student.admissionNumber.toLowerCase();
      const cls = (s.student.class?.name ?? '').toLowerCase();
      return name.includes(q) || adm.includes(q) || cls.includes(q);
    });
  }, [students, search]);

  // ── States ───────────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="text-red-500 text-xl" />
            </div>
            <p className="text-gray-700 font-medium mb-4">
              {error instanceof Error ? error.message : 'Failed to load data'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-800">Students with Dues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Students with pending fee payments for{' '}
            <span className="font-medium text-gray-700">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </p>
        </div>

        {/* ── Month / Year filter ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Filter by</p>

          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none bg-white"
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none bg-white"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* ── Stats ── */}
        {students.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<FiUsers />}
              label="Students with Dues"
              value={String(students.length)}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              sub={`${partialCount} partial · ${pendingCount} pending`}
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
              icon={<FiCheckCircle />}
              label="Total Paid"
              value={formatCurrency(totalPaid)}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              sub="Collected so far"
            />
            <StatCard
              icon={<FiDollarSign />}
              label="Total Payable"
              value={formatCurrency(totalPayable)}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              sub="This month"
            />
          </div>
        )}

        {/* ── Empty state ── */}
        {students.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-emerald-500 text-2xl" />
            </div>
            <p className="text-gray-800 font-semibold text-lg">All Clear!</p>
            <p className="text-sm text-gray-400 mt-1">
              No outstanding dues for {MONTH_NAMES[selectedMonth]} {selectedYear}.
            </p>
          </div>
        )}

        {/* ── Students list ── */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

            {/* table header + search */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {filtered.length} {filtered.length === 1 ? 'Student' : 'Students'}
                  {search && <span className="text-gray-400 font-normal"> matching "{search}"</span>}
                </p>
              </div>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name, admission no., class…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none w-64"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No students match your search.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((s: StudentWithDue) => {
                  const fullName = `${s.student.firstName} ${s.student.lastName}`;
                  const avatarColor = AVATAR_COLORS[s.student.firstName.charCodeAt(0) % 6];
                  return (
                    <div
                      key={s.studentId}
                      onClick={() => navigate(`/dashboard/students/${s.studentId}`)}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {s.student.studentPhoto ? (
                          <img
                            src={s.student.studentPhoto}
                            alt={fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${avatarColor}`}>
                            {getInitials(s.student.firstName, s.student.lastName)}
                          </div>
                        )}
                      </div>

                      {/* Name + admission */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-red-600 transition-colors truncate">
                          {fullName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{s.student.admissionNumber}</span>
                          {s.student.class?.name && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-xs text-gray-400">{s.student.class.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs text-gray-400">Paid</span>
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(s.paidAmount)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Due</span>
                        <span className="text-sm font-semibold text-red-500">
                          {formatCurrency(s.dueAmount)}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsWithDues;
