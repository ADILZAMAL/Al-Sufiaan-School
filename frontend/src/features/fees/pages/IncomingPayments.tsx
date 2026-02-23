import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { fetchIncomingPayments, verifyPayment, IncomingPaymentType } from '../../../api';
import { useAppContext } from '../../../providers/AppContext';
import { getCurrentSchool } from '../../../api/school';
import { FaCheckCircle, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import { FiClock, FiDollarSign, FiFilter, FiInbox } from 'react-icons/fi';

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

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ── Mode pill color ───────────────────────────────────────────────────────────
const MODE_COLORS: Record<string, string> = {
  Cash: 'bg-emerald-50 text-emerald-700',
  UPI: 'bg-blue-50 text-blue-700',
  'Bank Transfer': 'bg-purple-50 text-purple-700',
  Cheque: 'bg-orange-50 text-orange-700',
  Online: 'bg-indigo-50 text-indigo-700',
};
const modeColor = (mode: string) => MODE_COLORS[mode] ?? 'bg-gray-100 text-gray-700';

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}
const StatCard = ({ icon, label, value, iconBg, iconColor }: StatCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <span className={`text-xl ${iconColor}`}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IncomingPayments() {
  const { showToast, userRole } = useAppContext();
  const { data: school } = useQuery('currentSchool', getCurrentSchool);

  const paymentModesOptions = school?.paymentModes
    ? [{ value: 'all', label: 'All Modes' }, ...school.paymentModes.map((m: string) => ({ value: m, label: m }))]
    : [{ value: 'all', label: 'All Modes' }];

  const [payments, setPayments] = useState<IncomingPaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState('all');

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (fromDate) filters.fromDate = new Date(fromDate);
      if (toDate) filters.toDate = new Date(toDate);
      if (paymentMode !== 'all') filters.paymentMode = paymentMode;
      const response = await fetchIncomingPayments(
        currentPage, 10,
        filters.fromDate, filters.toDate, filters.paymentMode,
      );
      setPayments(response.payments);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, [currentPage]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPayments();
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      setVerifyingPayment(paymentId);
      await verifyPayment(paymentId);
      showToast({ message: 'Payment verified successfully!', type: 'SUCCESS' });
      loadPayments();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to verify payment',
        type: 'ERROR',
      });
    } finally {
      setVerifyingPayment(null);
    }
  };

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const totalAmount = payments.reduce((s, p) => s + p.amountPaid, 0);
  const verifiedCount = payments.filter((p) => p.verified).length;
  const pendingCount = payments.filter((p) => !p.verified).length;
  const colSpan = isAdmin ? 10 : 9;

  const paginationStart = (currentPage - 1) * 10 + 1;
  const paginationEnd = Math.min(currentPage * 10, totalItems);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Incoming Payments</h1>
          <p className="text-sm text-gray-500 mt-1">View all fee payments received from students</p>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FiInbox />}
            label="Total Payments"
            value={totalItems}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<FiDollarSign />}
            label="Amount (This Page)"
            value={formatCurrency(totalAmount)}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="Verified"
            value={verifiedCount}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            icon={<FiClock />}
            label="Pending"
            value={pendingCount}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-500"
          />
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-gray-400 text-sm" />
            <p className="text-sm font-semibold text-gray-700">Filters</p>
          </div>
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                {paymentModesOptions.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </form>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Payment Records</p>
            {!loading && totalItems > 0 && (
              <p className="text-xs text-gray-400">
                {totalItems} total
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Student', 'Month/Year', 'Amount', 'Payment Date', 'Mode', 'Reference', 'Received By', 'Remarks', 'Status', ...(isAdmin ? ['Actions'] : [])].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
                        <p className="text-sm text-gray-400">Loading payments…</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center">
                      <p className="text-red-500 text-sm mb-3">{error}</p>
                      <button
                        onClick={loadPayments}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center">
                      <p className="text-gray-400 text-sm">No payments found for the selected filters</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      {/* Student */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-800">{payment.studentName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{payment.className} · {payment.admissionNumber}</p>
                      </td>
                      {/* Month/Year */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {MONTH_NAMES[payment.month]} {payment.year}
                        </span>
                      </td>
                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(payment.amountPaid)}
                        </span>
                      </td>
                      {/* Payment Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{formatDate(payment.paymentDate)}</span>
                      </td>
                      {/* Mode */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${modeColor(payment.paymentMode)}`}>
                          {payment.paymentMode}
                        </span>
                      </td>
                      {/* Reference */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{payment.referenceNumber || '—'}</span>
                      </td>
                      {/* Received By */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{payment.receivedBy}</span>
                      </td>
                      {/* Remarks */}
                      <td className="px-5 py-4 max-w-[160px]">
                        <span className="text-sm text-gray-400 truncate block">{payment.remarks || '—'}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {payment.verified ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                              <FaCheckCircle className="text-[10px]" />
                              Verified
                            </span>
                            {payment.verifiedBy && (
                              <p className="text-xs text-gray-400 mt-1">by {payment.verifiedBy}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
                            <FiClock className="text-[10px]" />
                            Pending
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          {!payment.verified && (
                            <button
                              onClick={() => handleVerifyPayment(payment.id)}
                              disabled={verifyingPayment === payment.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {verifyingPayment === payment.id ? (
                                <><FaSpinner className="animate-spin" /> Verifying…</>
                              ) : (
                                <><FaShieldAlt /> Verify</>
                              )}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {paginationStart}–{paginationEnd} of {totalItems}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
