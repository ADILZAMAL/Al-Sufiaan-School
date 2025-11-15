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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch expense categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    'expenseCategories',
    () => apiClient.fetchExpenseCategories(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleAddExpense = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }
    
    if (!newExpense.categoryId) {
      setAmountError("Please select a category");
      return;
    }

    if (!newExpense.name.trim()) {
      setAmountError("Please enter an expense name");
      return;
    }

    setIsSubmitting(true);
    setAmountError(null);

    try {
      await apiClient.addExpense({
        name: newExpense.name.trim(),
        amount: newExpense.amount,
        categoryId: newExpense.categoryId
      });
      
      onExpenseAdded();
      onClose();
      setNewExpense({ name: "", amount: "", categoryId: null });
    } catch (error) {
      console.error("Error adding expense:", error);
      setAmountError(error instanceof Error ? error.message : "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
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
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            onClick={handleAddExpense}
            disabled={categoriesLoading || categories.length === 0 || isSubmitting || !newExpense.name.trim()}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              "Add Expense"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
