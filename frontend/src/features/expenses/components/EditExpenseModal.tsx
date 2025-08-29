import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../../../api";
import { ExpenseType } from "../../../api";

type EditExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated: () => void;
  expense: ExpenseType | null;
};

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseUpdated,
  expense,
}) => {
  const [updatedExpense, setUpdatedExpense] = useState<{
    name: string;
    amount: string;
    categoryId: number | null;
  }>({
    name: "",
    amount: "",
    categoryId: null,
  });
  const [amountError, setAmountError] = useState<string | null>(null);

  // Fetch expense categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    'expenseCategories',
    () => apiClient.fetchExpenseCategories(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  useEffect(() => {
    if (expense) {
      setUpdatedExpense({
        name: expense.name,
        amount: expense.amount.toString(),
        categoryId: expense.categoryId || null,
      });
    }
  }, [expense]);

  const handleUpdateExpense = () => {
    if (!expense) return;

    const amount = parseFloat(updatedExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }

    if (!updatedExpense.categoryId) {
      setAmountError("Please select a category");
      return;
    }

    apiClient
      .updateExpense(expense.id, {
        name: updatedExpense.name,
        amount: updatedExpense.amount,
        categoryId: updatedExpense.categoryId
      })
      .then(() => {
        onExpenseUpdated();
        onClose();
      })
      .catch((error) => {
        console.error("Error updating expense:", error);
        setAmountError(error.message || "Failed to update expense");
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">
          Edit Expense
        </h3>
        <div className="space-y-4">
          <input
            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Expense Name"
            value={updatedExpense.name}
            onChange={(e) =>
              setUpdatedExpense({ ...updatedExpense, name: e.target.value })
            }
          />
          <input
            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Amount (e.g., 100.00)"
            type="text"
            value={updatedExpense.amount}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(value)) {
                setUpdatedExpense({ ...updatedExpense, amount: value });
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
            value={updatedExpense.categoryId || ""}
            onChange={(e) =>
              setUpdatedExpense({
                ...updatedExpense,
                categoryId: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            disabled={categoriesLoading}
          >
            <option value="">
              {categoriesLoading ? "Loading categories..." : "Select a category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && !categoriesLoading && (
            <p className="text-sm text-orange-600 mt-1">
              No categories available. Please create categories in Settings first.
            </p>
          )}
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleUpdateExpense}
            disabled={categoriesLoading || categories.length === 0}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
