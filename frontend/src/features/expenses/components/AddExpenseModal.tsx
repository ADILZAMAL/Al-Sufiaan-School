import React, { useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../../../api";

type AddExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
};

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
}) => {
  const [newExpense, setNewExpense] = useState<{
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

  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }
    
    if (!newExpense.categoryId) {
      setAmountError("Please select a category");
      return;
    }

    apiClient
      .addExpense({
        name: newExpense.name,
        amount: newExpense.amount,
        categoryId: newExpense.categoryId
      })
      .then(() => {
        onExpenseAdded();
        onClose();
        setNewExpense({ name: "", amount: "", categoryId: null });
      })
      .catch((error) => {
        console.error("Error adding expense:", error);
        setAmountError(error.message || "Failed to add expense");
      });
  };

  if (!isOpen) return null;

  return (
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
            value={newExpense.categoryId || ""}
            onChange={(e) =>
              setNewExpense({
                ...newExpense,
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
            onClick={handleAddExpense}
            disabled={categoriesLoading || categories.length === 0}
          >
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
