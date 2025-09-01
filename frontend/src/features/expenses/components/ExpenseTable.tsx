import React from "react";
import { ExpenseType } from "../../../api";
import { FaEdit, FaTrash } from "react-icons/fa";

type Expense = ExpenseType;

type ExpenseTableProps = {
  expenses: Expense[];
  isLoading: boolean;
  error: any;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  isLoading,
  error,
  onEdit,
  onDelete,
}) => {
  const isToday = (date: Date) => {
    const today = new Date();
    const givenDate = new Date(date);
    return (
      today.getFullYear() === givenDate.getFullYear() &&
      today.getMonth() === givenDate.getMonth() &&
      today.getDate() === givenDate.getDate()
    );
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-center">
        Failed to load expenses. Please try again later.
      </div>
    );
  }

  return (
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
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {expense.name}
                    {expense.isVendorPayment && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Vendor Payment
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {expense.expenseCategory.name}
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
                  {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                  {expense.isVendorPayment ? (
                    <span className="text-xs text-gray-400 italic">
                      Manage via Vendor Payments
                    </span>
                  ) : (
                    isToday(expense.createdAt) && (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => onEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onDelete(expense)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
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
