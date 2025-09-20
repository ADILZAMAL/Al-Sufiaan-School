import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  FeeCategory, 
  FeeCategoryFormData, 
  FEE_TYPES, 
  PRICING_TYPES 
} from '../types';

interface FeeCategoryFormProps {
  category?: FeeCategory;
  onSubmit: (data: FeeCategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const FeeCategoryForm: React.FC<FeeCategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<FeeCategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      pricingType: category?.pricingType || 'Fixed',
      fixedAmount: category?.fixedAmount || 0,
      feeType: category?.feeType || 'Annual',
      isRefundable: category?.isRefundable || false,
      isMandatory: category?.isMandatory !== undefined ? category.isMandatory : true,
      displayOrder: category?.displayOrder || 0
    }
  });

  const watchPricingType = watch('pricingType');

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        pricingType: category.pricingType,
        fixedAmount: category.fixedAmount,
        feeType: category.feeType,
        isRefundable: category.isRefundable,
        isMandatory: category.isMandatory,
        displayOrder: category.displayOrder
      });
    }
  }, [category, reset]);

  const handleFormSubmit = (data: FeeCategoryFormData) => {
    // If pricing type is not Fixed, set fixedAmount to 0
    if (data.pricingType !== 'Fixed') {
      data.fixedAmount = 0;
    }
    onSubmit(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'Create Fee Category' : 'Edit Fee Category'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Fee Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Fee Category Name *
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { 
              required: 'Fee category name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., School Fee, Transport Fee"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>


        {/* Fee Type and Pricing Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee Type */}
          <div>
            <label htmlFor="feeType" className="block text-sm font-medium text-gray-700 mb-2">
              Fee Type *
            </label>
            <select
              id="feeType"
              {...register('feeType', { required: 'Fee type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FEE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.feeType && (
              <p className="mt-1 text-sm text-red-600">{errors.feeType.message}</p>
            )}
          </div>

          {/* Pricing Type */}
          <div>
            <label htmlFor="pricingType" className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Type *
            </label>
            <select
              id="pricingType"
              {...register('pricingType', { required: 'Pricing type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PRICING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.pricingType && (
              <p className="mt-1 text-sm text-red-600">{errors.pricingType.message}</p>
            )}
          </div>
        </div>

        {/* Fixed Amount (only show if pricing type is Fixed) */}
        {watchPricingType === 'Fixed' && (
          <div>
            <label htmlFor="fixedAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Fixed Amount (₹) *
            </label>
            <input
              type="number"
              id="fixedAmount"
              min="0"
              step="0.01"
              {...register('fixedAmount', { 
                required: watchPricingType === 'Fixed' ? 'Fixed amount is required' : false,
                min: { value: 0, message: 'Amount must be greater than or equal to 0' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.fixedAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.fixedAmount.message}</p>
            )}
          </div>
        )}

        {/* Display Order */}
        <div>
          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            id="displayOrder"
            min="0"
            {...register('displayOrder', { 
              min: { value: 0, message: 'Display order must be greater than or equal to 0' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
          {errors.displayOrder && (
            <p className="mt-1 text-sm text-red-600">{errors.displayOrder.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Lower numbers appear first in the list
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isMandatory"
              {...register('isMandatory')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isMandatory" className="ml-2 block text-sm text-gray-700">
              Mandatory Fee
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRefundable"
              {...register('isRefundable')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRefundable" className="ml-2 block text-sm text-gray-700">
              Refundable Fee
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </div>
            ) : (
              mode === 'create' ? 'Create Fee Category' : 'Update Fee Category'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeeCategoryForm;
