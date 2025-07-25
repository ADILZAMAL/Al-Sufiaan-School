import React from "react";
import * as apiClient from "../../../api";
import { ExpenseType } from "../../../api";

type DeleteExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExpenseDeleted: () => void;
  expense: ExpenseType | null;
};

const DeleteExpenseModal: React.FC<DeleteExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseDeleted,
  expense,
}) => {
  const handleDeleteExpense = () => {
    if (!expense) return;

    apiClient
      .deleteExpense(expense.id)
      .then(() => {
        onExpenseDeleted();
        onClose();
      })
      .catch((error) => {
        console.error("Error deleting expense:", error);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">
          Delete Expense
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this expense? This action cannot be
          undone.
        </p>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            onClick={handleDeleteExpense}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteExpenseModal;
