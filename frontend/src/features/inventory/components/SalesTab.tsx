import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { FaChevronDown, FaChevronUp, FaCheck, FaCheckCircle, FaClock } from "react-icons/fa";
import { FiClock, FiDollarSign, FiFilter, FiInbox } from "react-icons/fi";
import { getCurrentSchool } from "../../../api/school";
import { useAppContext } from "../../../providers/AppContext";
import TransactionItemsList from "../components/TransactionItemsList";
import { formatDate } from "../utils";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

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

const SalesTab = () => {
  const { userRole } = useAppContext();
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [pendingVerifyId, setPendingVerifyId] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  // Server-side filters only take effect on Apply (status is filtered client-side, like Incoming Payments)
  const [appliedFilters, setAppliedFilters] = useState({ fromDate: today, toDate: today, paymentMode: "all" });

  const queryClient = useQueryClient();

  const { data: school } = useQuery("currentSchool", getCurrentSchool);
  const paymentModes: string[] = school?.paymentModes || [];

  const { data: transactionData, isLoading, isError, error, refetch } = useQuery(
    ["fetchTransactions", appliedFilters],
    () =>
      apiClient.fetchTransactions(
        undefined,
        undefined,
        appliedFilters.paymentMode === "all" ? undefined : appliedFilters.paymentMode,
        undefined,
        appliedFilters.fromDate ? new Date(appliedFilters.fromDate) : undefined,
        appliedFilters.toDate ? new Date(appliedFilters.toDate) : undefined
      )
  );

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExpandedTransactions(new Set());
    setAppliedFilters({ fromDate, toDate, paymentMode: paymentModeFilter });
  };

  const transactions = transactionData?.transactions ?? [];
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const verifiedCount = transactions.filter((t) => t.isVerified).length;
  const pendingCount = transactions.length - verifiedCount;
  const filteredTransactions =
    statusFilter === "all" ? transactions
    : statusFilter === "verified" ? transactions.filter((t) => t.isVerified)
    : transactions.filter((t) => !t.isVerified);

  const toggleTransactionExpansion = (transactionId: number) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const verifyTransactionMutation = useMutation(
    (transactionId: number) => apiClient.verifyTransaction(transactionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["fetchTransactions"]);
        queryClient.invalidateQueries("fetchRecentTransactions");
        setPendingVerifyId(null);
      },
      onError: (error: any) => {
        console.error("Error verifying transaction:", error);
        setPendingVerifyId(null);
      },
    }
  );

  const renderVerificationStatus = (transaction: TransactionType) => {
    if (transaction.isVerified) {
      return (
        <div className="flex items-center gap-1.5">
          <FaCheckCircle className="text-emerald-500 text-sm" />
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Verified
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <FaClock className="text-amber-500 text-sm" />
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          Pending
        </span>
      </div>
    );
  };

  const renderVerificationAction = (transaction: TransactionType) => {
    if (transaction.isVerified) {
      return (
        <span className="text-xs text-gray-400">
          by {transaction.verifiedBy}
        </span>
      );
    }

    if (userRole !== "SUPER_ADMIN") return null;

    const isVerifying = verifyTransactionMutation.isLoading && pendingVerifyId === transaction.id;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setPendingVerifyId(transaction.id);
          verifyTransactionMutation.mutate(transaction.id);
        }}
        disabled={isVerifying}
        className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
      >
        {isVerifying ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
        ) : (
          <FaCheck className="text-xs" />
        )}
        Verify
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FiInbox />}
          label="Total Payments"
          value={transactions.length}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<FiDollarSign />}
          label="Total Incoming"
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

      {/* Filters */}
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
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
            >
              <option value="all">All Modes</option>
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "verified" | "pending")}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[130px]"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-red-500 text-sm mb-3">
            {error instanceof Error ? error.message : "Failed to fetch transactions"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No transactions found for the selected filters
              </div>
            ) : (
              <>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Student", "Payment", "Mode", "Sold By", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((transaction: TransactionType) => (
                      <React.Fragment key={transaction.id}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleTransactionExpansion(transaction.id)}
                        >
                          {/* Student */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-800">{transaction.studentName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {transaction.className} – {transaction.sectionName}
                            </p>
                          </td>
                          {/* Payment — amount + date + reference */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <p className="text-sm font-semibold text-emerald-600">₹{transaction.totalAmount.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(transaction.createdAt)}</p>
                            {transaction.referenceId && (
                              <p className="text-xs text-gray-400 mt-0.5 font-mono">{transaction.referenceId}</p>
                            )}
                          </td>
                          {/* Mode */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {transaction.modeOfPayment}
                            </span>
                          </td>
                          {/* Sold By */}
                          <td className="px-3 py-2.5 max-w-[160px]">
                            <p className="text-sm text-gray-700 truncate">{transaction.soldBy}</p>
                          </td>
                          {/* Status + Verify action */}
                          <td
                            className="px-3 py-2.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col items-start gap-1.5">
                              {renderVerificationStatus(transaction)}
                              {renderVerificationAction(transaction)}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-gray-400 text-sm">
                            {expandedTransactions.has(transaction.id) ? <FaChevronUp /> : <FaChevronDown />}
                          </td>
                        </tr>
                        {expandedTransactions.has(transaction.id) && (
                          <tr>
                            <td colSpan={6} className="px-5 py-4 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Products Purchased
                              </p>
                              <TransactionItemsList items={transaction.transactionItems} />
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                <div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    Total: ₹{transaction.totalAmount.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-400 ml-3">
                                    via {transaction.modeOfPayment}
                                    {transaction.referenceId && ` (Ref: ${transaction.referenceId})`}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {renderVerificationStatus(transaction)}
                                  {transaction.isVerified && transaction.verifiedBy && (
                                    <span className="text-xs text-gray-400">
                                      by {transaction.verifiedBy}
                                      {transaction.verifiedAt && ` on ${formatDate(transaction.verifiedAt)}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-right text-xs text-gray-400 mt-2">
                                Transaction #{transaction.id}
                              </p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

        </>
      )}
    </div>
  );
};

export default SalesTab;
