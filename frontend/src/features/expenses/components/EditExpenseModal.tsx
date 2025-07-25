import React, { useState, useEffect } from "react";
import * as apiClient from "../../../api";
import { ExpenseType } from "../../../api";

const CATEGORY_OPTIONS = [
  "SALARY",
  "LPG",
  "KITCHEN",
  "BUILDING",
  "DIRECTOR",
  "PETROL",
  "OTHERS",
  "SOHAIL",
  "ADIL",
] as const;

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
    category: (typeof CATEGORY_OPTIONS)[number];
  }>({
    name: "",
    amount: "",
    category: CATEGORY_OPTIONS[0],
  });
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setUpdatedExpense({
        name: expense.name,
        amount: expense.amount.toString(),
        category: expense.category as (typeof CATEGORY_OPTIONS)[number],
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
    apiClient
      .updateExpense(expense.id, updatedExpense)
      .then(() => {
        onExpenseUpdated();
        onClose();
      })
      .catch((error) => {
        console.error("Error updating expense:", error);
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
            value={updatedExpense.category}
            onChange={(e) =>
              setUpdatedExpense({
                ...updatedExpense,
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
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={handleUpdateExpense}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
