import React, { useState } from 'react';
import { useClassFeePricingManager } from '../hooks/useClassFeePricing';
import { CreateClassFeePricingRequest } from '../types';

const ClassFeePricing: React.FC = () => {
  const {
    classFeePricing,
    feeCategories,
    classes,
    isLoading,
    createPricing,
    isCreating,
    createError,
    utils
  } = useClassFeePricingManager();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    feeCategoryId: '',
    amount: '',
    academicYear: utils.getCurrentAcademicYear(),
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: new Date(new Date().getFullYear() + 1, 2, 31).toISOString().split('T')[0] // March 31 next year
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateClassFeePricingRequest = {
      classId: parseInt(formData.classId),
      feeCategoryId: parseInt(formData.feeCategoryId),
      amount: parseFloat(formData.amount),
      academicYear: formData.academicYear,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo
    };

    createPricing(data, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({
          classId: '',
          feeCategoryId: '',
          amount: '',
          academicYear: utils.getCurrentAcademicYear(),
          effectiveFrom: new Date().toISOString().split('T')[0],
          effectiveTo: new Date(new Date().getFullYear() + 1, 2, 31).toISOString().split('T')[0]
        });
      }
    });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Class Fee Pricing</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Pricing'}
        </button>
      </div>

      {/* Add New Pricing Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Class Fee Pricing</h2>
          
          {createError ? (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error creating fee pricing</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{createError instanceof Error ? createError.message : String(createError) || 'An unexpected error occurred'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Category
              </label>
              <select
                value={formData.feeCategoryId}
                onChange={(e) => setFormData({ ...formData, feeCategoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Fee Category</option>
                {feeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.feeType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {utils.generateAcademicYears().map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective From
              </label>
              <input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective To
              </label>
              <input
                type="date"
                value={formData.effectiveTo}
                onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Pricing'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pricing Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Current Fee Pricing</h2>
        </div>
        
        {classFeePricing.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No fee pricing configured yet. Add your first pricing above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classFeePricing.map((pricing) => (
                  <tr key={pricing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pricing.class?.name || 'Unknown Class'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pricing.feeCategory?.name || 'Unknown Category'}
                      <span className="ml-2 text-xs text-gray-400">
                        ({pricing.feeCategory?.feeType})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {utils.formatAmount(pricing.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pricing.academicYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pricing.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pricing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ClassFeePricing;
