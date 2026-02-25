import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { FaTimes } from "react-icons/fa";
import * as apiClient from "../../../api";
import { ExpenseType } from "../../../api";

type EditExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated: () => void;
  expense: ExpenseType | null;
};

const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";
const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    "expenseCategories",
    () => apiClient.fetchExpenseCategories(),
    { staleTime: 5 * 60 * 1000 }
  );

  useEffect(() => {
    if (expense) {
      setUpdatedExpense({
        name: expense.name,
        amount: expense.amount.toString(),
        categoryId: expense.categoryId || null,
      });
      setFormError(null);
    }
  }, [expense]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleUpdateExpense = async () => {
    if (!expense || isSubmitting) return;

    if (!updatedExpense.name.trim()) {
      setFormError("Please enter an expense name");
      return;
    }

    const amount = parseFloat(updatedExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }

    if (!updatedExpense.categoryId) {
      setFormError("Please select a category");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiClient.updateExpense(expense.id, {
        name: updatedExpense.name.trim(),
        amount: updatedExpense.amount,
        categoryId: updatedExpense.categoryId,
      });
      onExpenseUpdated();
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Edit Expense</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Expense Name</label>
            <input
              className={inputClass}
              placeholder="e.g. Electricity Bill"
              value={updatedExpense.name}
              onChange={(e) => setUpdatedExpense({ ...updatedExpense, name: e.target.value })}
            />
          </div>

          {/* Amount */}
          <div>
            <label className={labelClass}>Amount (₹)</label>
            <input
              className={inputClass}
              placeholder="e.g. 1500.00"
              type="text"
              inputMode="decimal"
              value={updatedExpense.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(value)) {
                  setUpdatedExpense({ ...updatedExpense, amount: value });
                  setFormError(null);
                }
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <select
              className={inputClass}
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
              <p className="text-xs text-orange-600 mt-1.5">
                No categories available. Please create categories in Settings first.
              </p>
            )}
          </div>

          {formError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
            onClick={handleUpdateExpense}
            disabled={categoriesLoading || categories.length === 0 || isSubmitting || !updatedExpense.name.trim()}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
