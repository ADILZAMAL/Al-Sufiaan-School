import React, { useState, useMemo } from 'react';
import { useTransportationAreaPricingManager } from '../hooks/useTransportationAreaPricing';
import { TransportationAreaPricingFilters, CreateTransportationAreaPricingRequest, UpdateTransportationAreaPricingRequest } from '../types';

const TransportationAreaPricing: React.FC = () => {
  const [filters, setFilters] = useState<TransportationAreaPricingFilters>({
    page: 1,
    limit: 10,
    academicYear: '',
    isActive: true,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<any>(null);
  const [formData, setFormData] = useState({
    areaName: '',
    price: '',
    academicYear: '',
    description: '',
    displayOrder: '0',
  });

  const {
    transportationAreaPricing,
    pagination,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    createPricing,
    updatePricing,
    deletePricing,
    utils,
  } = useTransportationAreaPricingManager(filters);

  // Academic year options
  const academicYearOptions = useMemo(() => {
    return utils.generateAcademicYears(2024, 5);
  }, [utils]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      areaName: formData.areaName.trim(),
      price: parseFloat(formData.price),
      academicYear: formData.academicYear,
      description: formData.description.trim(),
      displayOrder: parseInt(formData.displayOrder) || 0,
    };

    // Validate form data
    const validationErrors = utils.validateFormData(data);
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    try {
      if (editingPricing) {
        await updatePricing({ id: editingPricing.id, data: data as UpdateTransportationAreaPricingRequest });
      } else {
        await createPricing(data as CreateTransportationAreaPricingRequest);
      }
      
      // Reset form
      setFormData({
        areaName: '',
        price: '',
        academicYear: '',
        description: '',
        displayOrder: '0',
      });
      setShowForm(false);
      setEditingPricing(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Handle edit
  const handleEdit = (pricing: any) => {
    setEditingPricing(pricing);
    setFormData({
      areaName: pricing.areaName,
      price: pricing.price.toString(),
      academicYear: pricing.academicYear,
      description: pricing.description || '',
      displayOrder: pricing.displayOrder.toString(),
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transportation area pricing?')) {
      try {
        await deletePricing(id);
      } catch (error) {
        console.error('Error deleting pricing:', error);
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof TransportationAreaPricingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transportation Area Pricing</h1>
        <p className="text-gray-600">Manage transportation fees by geographical areas</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Areas</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.uniqueAreas}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Records</h3>
            <p className="text-2xl font-bold text-green-600">{stats.activeRecords}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
            <p className="text-2xl font-bold text-gray-600">{stats.totalRecords}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Average Price</h3>
            <p className="text-2xl font-bold text-purple-600">{utils.formatCurrency(stats.averagePrice)}</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Academic Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={filters.academicYear || ''}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Years</option>
                {academicYearOptions.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>

            {/* Area Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
              <input
                type="text"
                value={filters.areaName || ''}
                onChange={(e) => handleFilterChange('areaName', e.target.value)}
                placeholder="Search areas..."
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingPricing(null);
              setFormData({
                areaName: '',
                price: '',
                academicYear: utils.getCurrentAcademicYear(),
                description: '',
                displayOrder: '0',
              });
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Pricing
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingPricing ? 'Edit Transportation Area Pricing' : 'Add New Transportation Area Pricing'}
            </h2>

            {(createError || updateError) ? (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{
                        (createError instanceof Error ? createError.message : String(createError)) ||
                        (updateError instanceof Error ? updateError.message : String(updateError)) ||
                        'An unexpected error occurred'
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
                <input
                  type="text"
                  value={formData.areaName}
                  onChange={(e) => setFormData(prev => ({ ...prev, areaName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Fee Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYearOptions.map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isCreating || isUpdating ? 'Saving...' : (editingPricing ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPricing(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transportationAreaPricing.map((pricing) => {
                const status = utils.getPricingStatus(pricing);
                const statusColor = utils.getStatusColor(status);
                
                return (
                  <tr key={pricing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pricing.areaName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {utils.formatCurrency(pricing.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pricing.academicYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(pricing)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pricing.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportationAreaPricing;
