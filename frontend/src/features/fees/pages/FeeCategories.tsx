import React, { useState } from 'react';
import { 
  useFeeCategories, 
  useCreateFeeCategory, 
  useUpdateFeeCategory, 
  useDeleteFeeCategory,
  useToggleFeeCategoryActive 
} from '../hooks/useFeeCategories';
import { FeeCategory, FeeCategoryFormData } from '../types';
import FeeCategoryForm from '../components/FeeCategoryForm';
import FeeCategoryTable from '../components/FeeCategoryTable';

const FeeCategories: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);

  // Hooks
  const { data: categories = [], isLoading, error } = useFeeCategories();
  const createMutation = useCreateFeeCategory();
  const updateMutation = useUpdateFeeCategory();
  const deleteMutation = useDeleteFeeCategory();
  const toggleActiveMutation = useToggleFeeCategoryActive();

  // Handlers
  const handleCreateNew = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: FeeCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: FeeCategoryFormData) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving fee category:', error);
      // Error handling is done in the hooks
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting fee category:', error);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ id, isActive });
    } catch (error) {
      console.error('Error toggling fee category status:', error);
    }
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading fee categories</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage fee categories for your school
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Fee Category
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <FeeCategoryForm
          category={editingCategory || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
          mode={editingCategory ? 'edit' : 'create'}
        />
      )}


      {/* Table */}
      {!showForm && (
        <FeeCategoryTable
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      )}

      {/* Loading states for mutations */}
      {(deleteMutation.isLoading || toggleActiveMutation.isLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">
              {deleteMutation.isLoading ? 'Deleting...' : 'Updating...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCategories;
