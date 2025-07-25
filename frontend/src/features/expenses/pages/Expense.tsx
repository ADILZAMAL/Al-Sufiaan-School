import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import * as apiClient from "../../../api";
import { ExpenseType } from "../../../api";
import { FaPlus } from "react-icons/fa";
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

const ExpenseDashboard: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseType | null>(
    null
  );
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

  const filteredExpenses: ExpenseType[] = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  const sortedExpenses: ExpenseType[] = useMemo(() => {
    if (!filteredExpenses) return [];
    return [...filteredExpenses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredExpenses]);

  const totalAmountForSelectedDate = useMemo(() => {
    if (!filteredExpenses) return 0;
    return filteredExpenses.reduce(
      (acc: any, expense: any) => acc + Number(expense.amount),
      0
    );
  }, [filteredExpenses]);


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Expense Management
          </h2>
          <div className="flex items-center gap-4">
            <ExpenseFilter
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              fromDate={fromDate}
              onFromDateChange={setFromDate}
              toDate={toDate}
              onToDateChange={setToDate}
            />
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FaPlus />
              Add Expense
            </button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Expenses by Category</h3>
              <ExpenseByCategoryPieChart expenses={filteredExpenses} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Total Expenses by Category</h3>
              <TotalExpensesByCategoryBarChart expenses={filteredExpenses} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Expense Trend</h3>
              <ExpenseTrendLineChart expenses={filteredExpenses} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Total For Selected Date</h3>
              <p className="text-3xl font-bold text-gray-800">
                ₹
                {totalAmountForSelectedDate.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

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
      </div>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExpenseAdded={() => {
          queryClient.invalidateQueries("expenses");
        }}
      />
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onExpenseUpdated={() => {
          queryClient.invalidateQueries("expenses");
        }}
        expense={selectedExpense}
      />
      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onExpenseDeleted={() => {
          queryClient.invalidateQueries("expenses");
        }}
        expense={selectedExpense}
      />
    </div>
  );
};

export default ExpenseDashboard;
