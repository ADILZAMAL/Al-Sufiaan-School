import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import * as apiClient from "../../../api";
import { ExpenseType } from "../../../api";
import { FaPlus } from "react-icons/fa";
import { FiTrendingDown, FiList, FiArrowUp, FiTag } from "react-icons/fi";
import {
  ExpenseByCategoryPieChart,
  TotalExpensesByCategoryBarChart,
  ExpenseTrendLineChart,
} from "../components/charts/ExpenseCharts";
import AddExpenseModal from "../components/AddExpenseModal";
import EditExpenseModal from "../components/EditExpenseModal";
import DeleteExpenseModal from "../components/DeleteExpenseModal";
import ExpenseFilter from "../components/ExpenseFilter";
import ExpenseTable from "../components/ExpenseTable";

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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

// ─── Main Component ───────────────────────────────────────────────────────────
const ExpenseDashboard: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [toDate, setToDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(
    ["expenses", searchTerm, fromDate, toDate],
    () => apiClient.fetchExpenses(searchTerm, fromDate, toDate)
  );

  const filteredExpenses: ExpenseType[] = useMemo(() => (data ?? []), [data]);

  const sortedExpenses: ExpenseType[] = useMemo(
    () =>
      [...filteredExpenses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filteredExpenses]
  );

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0),
    [filteredExpenses]
  );

  const highestExpense = useMemo(
    () =>
      filteredExpenses.length > 0
        ? Math.max(...filteredExpenses.map((e) => Number(e.amount)))
        : 0,
    [filteredExpenses]
  );

  const topCategory = useMemo(() => {
    if (!filteredExpenses.length) return "—";
    const totals: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const name = e.expenseCategory.name;
      totals[name] = (totals[name] ?? 0) + Number(e.amount);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [filteredExpenses]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Expense Management</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage all school expenses</p>
          </div>
          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FaPlus className="text-xs" />
            Add Expense
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FiTrendingDown />}
            label="Total Expenses"
            value={formatCurrency(totalAmount)}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            sub={`${filteredExpenses.length} transaction${filteredExpenses.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={<FiList />}
            label="Transactions"
            value={String(filteredExpenses.length)}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            sub="In selected range"
          />
          <StatCard
            icon={<FiArrowUp />}
            label="Highest Expense"
            value={filteredExpenses.length ? formatCurrency(highestExpense) : "—"}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            sub="Single transaction"
          />
          <StatCard
            icon={<FiTag />}
            label="Top Category"
            value={topCategory}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            sub="By spend amount"
          />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <ExpenseFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">By Category</p>
            <p className="text-xs text-gray-400 mb-4">Spend distribution</p>
            <ExpenseByCategoryPieChart expenses={filteredExpenses} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">Category Totals</p>
            <p className="text-xs text-gray-400 mb-4">Amount per category</p>
            <TotalExpensesByCategoryBarChart expenses={filteredExpenses} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">Expense Trend</p>
            <p className="text-xs text-gray-400 mb-4">Daily total over time</p>
            <ExpenseTrendLineChart expenses={filteredExpenses} />
          </div>
        </div>

        {/* ── Table ── */}
        <ExpenseTable
          expenses={sortedExpenses}
          isLoading={isLoading}
          error={error}
          onEdit={(expense) => {
            setSelectedExpense(expense);
            setIsEditModalOpen(true);
          }}
          onDelete={(expense) => {
            setSelectedExpense(expense);
            setIsDeleteModalOpen(true);
          }}
        />
      </div>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExpenseAdded={() => queryClient.invalidateQueries("expenses")}
      />
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onExpenseUpdated={() => queryClient.invalidateQueries("expenses")}
        expense={selectedExpense}
      />
      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onExpenseDeleted={() => queryClient.invalidateQueries("expenses")}
        expense={selectedExpense}
      />
    </div>
  );
};

export default ExpenseDashboard;
