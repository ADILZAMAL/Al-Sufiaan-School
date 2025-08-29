import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { HiOutlineExclamation } from 'react-icons/hi';
import * as apiClient from '../../../api';

interface ExpenseCategory {
  id: number;
  name: string;
  schoolId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ExpenseSettings: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');

  const queryClient = useQueryClient();

  // Fetch expense categories
  const { data: categories = [], isLoading, error } = useQuery(
    'expenseCategories',
    () => apiClient.fetchExpenseCategories(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Add category mutation
  const addCategoryMutation = useMutation(
    (name: string) => apiClient.addExpenseCategory({ name }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expenseCategories');
        setIsAddModalOpen(false);
        setNewCategoryName('');
      },
      onError: (error: Error) => {
        console.error('Error adding category:', error);
        // You can add toast notification here
      }
    }
  );

  // Update category mutation
  const updateCategoryMutation = useMutation(
    ({ id, name }: { id: number; name: string }) => 
      apiClient.updateExpenseCategory(id, { name }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expenseCategories');
        setIsEditModalOpen(false);
        setSelectedCategory(null);
        setEditCategoryName('');
      },
      onError: (error: Error) => {
        console.error('Error updating category:', error);
        // You can add toast notification here
      }
    }
  );

  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    (id: number) => apiClient.deleteExpenseCategory(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expenseCategories');
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      },
      onError: (error: Error) => {
        console.error('Error deleting category:', error);
        // You can add toast notification here
      }
    }
  );

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategoryMutation.mutate(newCategoryName.trim().toUpperCase());
    }
  };

  const handleEditCategory = () => {
    if (selectedCategory && editCategoryName.trim()) {
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        name: editCategoryName.trim().toUpperCase(),
      });
    }
  };

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };

  const openEditModal = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setEditCategoryName(category.name);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error Loading Categories</h3>
            <p className="text-red-600 mt-1">
              {error instanceof Error ? error.message : 'Failed to load expense categories'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Expense Categories</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
          >
            <FaPlus />
            Add Category
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Manage Categories</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage expense categories for your school
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-500">
                    Status: {category.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openDeleteModal(category)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No expense categories found. Add your first category to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || addCategoryMutation.isLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {addCategoryMutation.isLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Edit Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCategory(null);
                  setEditCategoryName('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                disabled={!editCategoryName.trim() || updateCategoryMutation.isLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updateCategoryMutation.isLoading ? 'Updating...' : 'Update Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <HiOutlineExclamation className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Category</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the category "{selectedCategory.name}"?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedCategory(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={deleteCategoryMutation.isLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteCategoryMutation.isLoading ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseSettings;
