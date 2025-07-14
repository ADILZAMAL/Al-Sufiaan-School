import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api/api-client";
import { FaPlus, FaSearch } from "react-icons/fa";

export type AddExpense = {
    name: string;
    amount: string;
    category: string;
}

const ExpenseDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(
    ["expenses", searchTerm, selectedDate],
    () => apiClient.fetchExpenses(searchTerm, selectedDate || undefined)
  );

  const CATEGORY_OPTIONS = [
    "SALARY",
    "LPG",
    "KITCHEN",
    "BUILDING",
    "DIRECTOR",
    "PETROL",
  ] as const;

  const [newExpense, setNewExpense] = useState<{
    name: string;
    amount: string;
    category: (typeof CATEGORY_OPTIONS)[number];
  }>({
    name: "",
    amount: "",
    category: CATEGORY_OPTIONS[0],
  });

  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }
    apiClient
      .addExpense(newExpense)
      .then(() => {
        setIsModalOpen(false);
        setNewExpense({ name: "", amount: "", category: CATEGORY_OPTIONS[0] });
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error adding expense:", error);
      });
  };

  const filteredExpenses = useMemo(() => {
    if (!data) return [];
    let filtered = data;
    if (searchTerm) {
      filtered = filtered.filter((expense: any) =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedDate) {
      filtered = filtered.filter(
        (expense: any) =>
          new Date(expense.createdAt).toDateString() ===
          selectedDate.toDateString()
      );
    }
    return filtered;
  }, [data, searchTerm, selectedDate]);

  const totalAmount = useMemo(() => {
    if (!filteredExpenses) return 0;
    return filteredExpenses.reduce(
      (acc: any, expense: any) => acc + Number(expense.amount),
      0
    );
  }, [filteredExpenses]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Expense Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                type="date"
                className="pl-4 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  setSelectedDate(e.target.value ? new Date(e.target.value) : null)
                }
              />
            </div>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus />
              Add Expense
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-center">
            Failed to load expenses. Please try again later.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.map((expense: any) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {expense.category}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            expense.amount > 1000
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          ₹
                          {Number(expense.amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.user.firstName} {expense.user.lastName}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-200">
                  <tr>
                    <td
                      colSpan={1}
                      className="py-4 px-6 text-right font-bold text-gray-800 uppercase"
                    >
                      Total
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-800">
                      <span className="text-lg">
                        ₹
                        {totalAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Add New Expense
            </h3>
            <div className="space-y-4">
              <input
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Expense Name"
                value={newExpense.name}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, name: e.target.value })
                }
              />
              <input
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amount (e.g., 100.00)"
                type="text"
                value={newExpense.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(value)) {
                    setNewExpense({ ...newExpense, amount: value });
                    setAmountError(null);
                  }
                }}
                inputMode="decimal"
              />
              {amountError && (
                <p className="text-red-500 text-xs mt-1">{amountError}</p>
              )}
              <select
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({
                    ...newExpense,
                    category: e.target.value as (typeof CATEGORY_OPTIONS)[number],
                  })
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                onClick={handleAddExpense}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDashboard;
