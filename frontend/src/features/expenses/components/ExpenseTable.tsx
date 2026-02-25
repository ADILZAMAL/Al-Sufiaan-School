import React from "react";
import { ExpenseType } from "../../../api";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";

type Expense = ExpenseType;

type ExpenseTableProps = {
  expenses: Expense[];
  isLoading: boolean;
  error: any;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

const isToday = (date: Date) => {
  const today = new Date();
  const d = new Date(date);
  return (
    today.getFullYear() === d.getFullYear() &&
    today.getMonth() === d.getMonth() &&
    today.getDate() === d.getDate()
  );
};

const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  isLoading,
  error,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 px-6 py-8 text-center">
        <p className="text-sm text-red-600 font-medium">Failed to load expenses. Please try again later.</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <FiFileText className="text-gray-400 text-xl" />
        </div>
        <p className="text-sm font-medium text-gray-600">No expenses found</p>
        <p className="text-xs text-gray-400">Try adjusting your search or date range</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Expense Records</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Expense
              </th>
              <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Added By
              </th>
              <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{expense.name}</span>
                    {expense.isVendorPayment && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        Vendor
                      </span>
                    )}
                    {expense.isPayslipPayment && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        Payslip
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {expense.expenseCategory.name}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{Number(expense.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {expense.user.firstName} {expense.user.lastName}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(expense.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })}
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {expense.isVendorPayment ? (
                    <span className="text-xs text-gray-400 italic">Via Vendor Payments</span>
                  ) : expense.isPayslipPayment ? (
                    <span className="text-xs text-gray-400 italic">Via Payslip Payments</span>
                  ) : (
                    isToday(expense.createdAt) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => onDelete(expense)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;
