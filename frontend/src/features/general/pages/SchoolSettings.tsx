import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getCurrentSchool, updateSchool, School } from '../../../api/school';
import { useAppContext } from '../../../providers/AppContext';
import { HiCheck, HiPlus, HiX, HiOutlineExclamation } from 'react-icons/hi';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useClassFeePricingManager } from '../../fees/hooks/useClassFeePricing';
import { CreateClassFeePricingRequest } from '../../fees/types';
import { useTransportationAreaPricingManager } from '../../transportation/hooks/useTransportationAreaPricing';
import { CreateTransportationAreaPricingRequest, UpdateTransportationAreaPricingRequest } from '../../transportation/types';
import * as apiClient from '../../../api';

interface ExpenseCategory {
  id: number;
  name: string;
  schoolId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SchoolSettings: React.FC = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<School>>({});
  const [newPaymentMode, setNewPaymentMode] = useState('');
  
  // Expense Categories state
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  
  // Class Fee Pricing hooks
  const {
    classFeePricing,
    classes,
    isLoading: isLoadingPricing,
    createPricing,
    isCreating,
    createError,
    utils
  } = useClassFeePricingManager();
  
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [pricingFormData, setPricingFormData] = useState({
    classId: '',
    amount: '',
    academicYear: utils.getCurrentAcademicYear()
  });

  // Transportation Area Pricing hooks (without filters)
  const {
    transportationAreaPricing,
    isLoading: isLoadingTransportation,
    isCreating: isCreatingTransportation,
    isUpdating: isUpdatingTransportation,
    isDeleting: isDeletingTransportation,
    createError: createTransportationError,
    updateError: updateTransportationError,
    createPricing: createTransportationPricing,
    updatePricing: updateTransportationPricing,
    deletePricing: deleteTransportationPricing,
    utils: transportationUtils
  } = useTransportationAreaPricingManager({ page: 1, limit: 1000 }); // Large limit to get all records

  const [showTransportationForm, setShowTransportationForm] = useState(false);
  const [editingTransportationPricing, setEditingTransportationPricing] = useState<any>(null);
  const [transportationFormData, setTransportationFormData] = useState({
    areaName: '',
    price: '',
    academicYear: transportationUtils.getCurrentAcademicYear(),
    description: '',
    displayOrder: '0',
  });

  // Academic year options for transportation
  const academicYearOptions = useMemo(() => {
    return transportationUtils.generateAcademicYears(2024, 5);
  }, [transportationUtils]);

  // Fetch expense categories
  const { data: expenseCategories = [], isLoading: isLoadingExpenseCategories, error: expenseCategoriesError } = useQuery(
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
        setIsAddCategoryModalOpen(false);
        setNewCategoryName('');
        showToast({ message: 'Expense category added successfully!', type: 'SUCCESS' });
      },
      onError: (error: Error) => {
        showToast({ message: error.message || 'Failed to add expense category', type: 'ERROR' });
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
        setIsEditCategoryModalOpen(false);
        setSelectedCategory(null);
        setEditCategoryName('');
        showToast({ message: 'Expense category updated successfully!', type: 'SUCCESS' });
      },
      onError: (error: Error) => {
        showToast({ message: error.message || 'Failed to update expense category', type: 'ERROR' });
      }
    }
  );

  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    (id: number) => apiClient.deleteExpenseCategory(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expenseCategories');
        setIsDeleteCategoryModalOpen(false);
        setSelectedCategory(null);
        showToast({ message: 'Expense category deleted successfully!', type: 'SUCCESS' });
      },
      onError: (error: Error) => {
        showToast({ message: error.message || 'Failed to delete expense category', type: 'ERROR' });
      }
    }
  );

  const { data: school, isLoading, refetch } = useQuery(
    'currentSchool',
    getCurrentSchool,
    {
      onSuccess: (data: School) => {
        setFormData(data);
      },
      onError: (error: Error) => {
        showToast({ message: error.message, type: 'ERROR' });
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<School> }) => updateSchool(id, data),
    {
      onSuccess: () => {
        showToast({ message: 'School information updated successfully!', type: 'SUCCESS' });
        setIsEditing(false);
        refetch();
      },
      onError: (error: Error) => {
        showToast({ message: error.message, type: 'ERROR' });
      },
    }
  );


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checkboxTarget = e.target as HTMLInputElement;
    const checked = checkboxTarget.checked;
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (type === 'number' && value !== '') {
      // Handle numeric fields to avoid floating point issues
      const numValue = parseFloat(value);
      // Round to 2 decimal places for monetary values
      const roundedValue = Math.round(numValue * 100) / 100;
      setFormData({
        ...formData,
        [name]: roundedValue,
      });
    } else {
      // Handle string/text fields
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (school?.id) {
      updateMutation.mutate({ id: school.id, data: formData });
    }
  };

  const handleCancel = () => {
    if (school) {
      setFormData(school);
    }
    setNewPaymentMode('');
    setIsEditing(false);
  };

  const handleAddPaymentMode = () => {
    if (newPaymentMode.trim()) {
      const currentModes = formData.paymentModes || [];
      if (!currentModes.includes(newPaymentMode.trim())) {
        setFormData({
          ...formData,
          paymentModes: [...currentModes, newPaymentMode.trim()]
        });
      }
      setNewPaymentMode('');
    }
  };

  const handleRemovePaymentMode = (mode: string) => {
    const currentModes = formData.paymentModes || [];
    setFormData({
      ...formData,
      paymentModes: currentModes.filter(m => m !== mode)
    });
  };

  const handlePaymentModeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPaymentMode();
    }
  };

  const handleReset = () => {
    refetch();
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateClassFeePricingRequest = {
      classId: parseInt(pricingFormData.classId),
      amount: parseFloat(pricingFormData.amount),
      academicYear: pricingFormData.academicYear
    };

    createPricing(data, {
      onSuccess: () => {
        setShowPricingForm(false);
        setPricingFormData({
          classId: '',
          amount: '',
          academicYear: utils.getCurrentAcademicYear()
        });
        showToast({ message: 'Class pricing created successfully!', type: 'SUCCESS' });
      },
      onError: (error: Error) => {
        showToast({ message: error.message || 'Failed to create class pricing', type: 'ERROR' });
      }
    });
  };

  const handleTransportationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      areaName: transportationFormData.areaName.trim(),
      price: parseFloat(transportationFormData.price),
      academicYear: transportationFormData.academicYear,
      description: transportationFormData.description.trim(),
      displayOrder: parseInt(transportationFormData.displayOrder) || 0,
    };

    // Validate form data
    const validationErrors = transportationUtils.validateFormData(data);
    if (validationErrors.length > 0) {
      showToast({ message: 'Please fix the following errors:\n' + validationErrors.join('\n'), type: 'ERROR' });
      return;
    }

    try {
      if (editingTransportationPricing) {
        updateTransportationPricing({ id: editingTransportationPricing.id, data: data as UpdateTransportationAreaPricingRequest }, {
          onSuccess: () => {
            setShowTransportationForm(false);
            setEditingTransportationPricing(null);
            setTransportationFormData({
              areaName: '',
              price: '',
              academicYear: transportationUtils.getCurrentAcademicYear(),
              description: '',
              displayOrder: '0',
            });
            showToast({ message: 'Transportation pricing updated successfully!', type: 'SUCCESS' });
          },
          onError: (error: Error) => {
            showToast({ message: error.message || 'Failed to update transportation pricing', type: 'ERROR' });
          }
        });
      } else {
        createTransportationPricing(data as CreateTransportationAreaPricingRequest, {
          onSuccess: () => {
            setShowTransportationForm(false);
            setTransportationFormData({
              areaName: '',
              price: '',
              academicYear: transportationUtils.getCurrentAcademicYear(),
              description: '',
              displayOrder: '0',
            });
            showToast({ message: 'Transportation pricing created successfully!', type: 'SUCCESS' });
          },
          onError: (error: Error) => {
            showToast({ message: error.message || 'Failed to create transportation pricing', type: 'ERROR' });
          }
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast({ message: 'An unexpected error occurred', type: 'ERROR' });
    }
  };

  const handleEditTransportation = (pricing: any) => {
    setEditingTransportationPricing(pricing);
    setTransportationFormData({
      areaName: pricing.areaName,
      price: pricing.price.toString(),
      academicYear: pricing.academicYear,
      description: pricing.description || '',
      displayOrder: pricing.displayOrder.toString(),
    });
    setShowTransportationForm(true);
  };

  const handleDeleteTransportation = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transportation area pricing?')) {
      try {
        deleteTransportationPricing(id, {
          onSuccess: () => {
            showToast({ message: 'Transportation pricing deleted successfully!', type: 'SUCCESS' });
          },
          onError: (error: Error) => {
            showToast({ message: error.message || 'Failed to delete transportation pricing', type: 'ERROR' });
          }
        });
      } catch (error) {
        console.error('Error deleting pricing:', error);
        showToast({ message: 'An unexpected error occurred', type: 'ERROR' });
      }
    }
  };

  // Expense Category handlers
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

  const openEditCategoryModal = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setEditCategoryName(category.name);
    setIsEditCategoryModalOpen(true);
  };

  const openDeleteCategoryModal = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">School Information</h2>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Refresh
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updateMutation.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <HiCheck className="text-lg" />
                  {updateMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SID (School ID)
                </label>
                <input
                  type="text"
                  name="sid"
                  value={formData.sid || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UDICE Code
                </label>
                <input
                  type="text"
                  name="udiceCode"
                  value={formData.udiceCode || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="active"
                  value={formData.active ? 'true' : 'false'}
                  onChange={(e) => handleChange({
                    target: { name: 'active', value: e.target.value === 'true', type: 'checkbox', checked: e.target.value === 'true' }
                  } as any)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Modes */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Modes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Payment Mode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value)}
                    onKeyPress={handlePaymentModeKeyPress}
                    disabled={!isEditing}
                    placeholder="e.g., Google Pay, PhonePe"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleAddPaymentMode}
                    disabled={!isEditing || !newPaymentMode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiPlus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Payment Modes
                </label>
                <div className="flex flex-wrap gap-2">
                  {(formData.paymentModes || []).length > 0 ? (
                    formData.paymentModes!.map((mode) => (
                      <div
                        key={mode}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
                      >
                        <span className="text-sm font-medium">{mode}</span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentMode(mode)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <HiX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No payment modes configured</p>
                  )}
                </div>
                {formData.paymentModes && formData.paymentModes.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    Warning: At least one payment mode should be configured
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Fee Structure</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hostel Fee (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="hostelFee"
                    value={formData.hostelFee || ''}
                    onChange={handleChange}
                    disabled={!isEditing}

                    placeholder="Leave empty if no hostel facility"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">₹</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Configure if your school offers hostel facilities
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Fee (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="admissionFee"
                    value={formData.admissionFee || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Leave empty if not applicable"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">₹</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Configure one-time admission fee for new students
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dayboarding Fee (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="dayboardingFee"
                    value={formData.dayboardingFee || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Leave empty if not applicable"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">₹</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Configure fixed dayboarding fee for students opting in
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Information */}
        <div className="mt-6 pt-4 border-t text-sm text-gray-500">
          <p>Last Updated: {school?.updatedAt ? new Date(school.updatedAt).toLocaleString() : 'N/A'}</p>
        </div>
      </div>

      {/* Class Fee Pricing Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Class Tuition Fee Pricing</h2>
          <button
            onClick={() => setShowPricingForm(!showPricingForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showPricingForm ? 'Cancel' : 'Add New Pricing'}
          </button>
        </div>

        {/* Add New Pricing Form */}
        {showPricingForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Add New Class Tuition Fee Pricing</h3>
            
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

            <form onSubmit={handlePricingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={pricingFormData.classId}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, classId: e.target.value })}
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
                  Tuition Fee Amount (₹)
                </label>
                <input
                  type="number"
                  value={pricingFormData.amount}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tuition fee amount"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={pricingFormData.academicYear}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, academicYear: e.target.value })}
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold">Current Tuition Fee Pricing</h3>
          </div>
          
          {isLoadingPricing ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : classFeePricing.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No tuition fee pricing configured yet. Add your first pricing above.
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
                      Fee Type
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Tuition Fee
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
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

      {/* Transportation Area Pricing Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Transportation Area Pricing</h2>
          <button
            onClick={() => {
              setEditingTransportationPricing(null);
              setTransportationFormData({
                areaName: '',
                price: '',
                academicYear: transportationUtils.getCurrentAcademicYear(),
                description: '',
                displayOrder: '0',
              });
              setShowTransportationForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add New Pricing
          </button>
        </div>

        {/* Form Modal */}
        {showTransportationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">
                {editingTransportationPricing ? 'Edit Transportation Area Pricing' : 'Add New Transportation Area Pricing'}
              </h2>

              {(createTransportationError || updateTransportationError) ? (
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
                          (createTransportationError instanceof Error ? createTransportationError.message : String(createTransportationError)) ||
                          (updateTransportationError instanceof Error ? updateTransportationError.message : String(updateTransportationError)) ||
                          'An unexpected error occurred'
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleTransportationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
                  <input
                    type="text"
                    value={transportationFormData.areaName}
                    onChange={(e) => setTransportationFormData(prev => ({ ...prev, areaName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Fee Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={transportationFormData.price}
                    onChange={(e) => setTransportationFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select
                    value={transportationFormData.academicYear}
                    onChange={(e) => setTransportationFormData(prev => ({ ...prev, academicYear: e.target.value }))}
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
                    value={transportationFormData.description}
                    onChange={(e) => setTransportationFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={transportationFormData.displayOrder}
                    onChange={(e) => setTransportationFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isCreatingTransportation || isUpdatingTransportation}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isCreatingTransportation || isUpdatingTransportation ? 'Saving...' : (editingTransportationPricing ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransportationForm(false);
                      setEditingTransportationPricing(null);
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold">Current Transportation Area Pricing</h3>
          </div>
          
          {isLoadingTransportation ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : transportationAreaPricing.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transportation area pricing configured yet. Add your first pricing above.
            </div>
          ) : (
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
                    const status = transportationUtils.getPricingStatus(pricing);
                    const statusColor = transportationUtils.getStatusColor(status);
                    
                    return (
                      <tr key={pricing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pricing.areaName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transportationUtils.formatCurrency(pricing.price)}
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
                              onClick={() => handleEditTransportation(pricing)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTransportation(pricing.id)}
                              disabled={isDeletingTransportation}
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
          )}
        </div>
      </div>

      {/* Expense Categories Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Expense Categories</h2>
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
          >
            <FaPlus />
            Add Category
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Manage Categories</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage expense categories for your school
            </p>
          </div>

          {isLoadingExpenseCategories ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : expenseCategoriesError ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">Error Loading Categories</h3>
                <p className="text-red-600 mt-1">
                  {expenseCategoriesError instanceof Error ? expenseCategoriesError.message : 'Failed to load expense categories'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">
                        Status: {category.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openDeleteCategoryModal(category)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {expenseCategories.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">No expense categories found. Add your first category to get started.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
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
                  setIsAddCategoryModalOpen(false);
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
      {isEditCategoryModalOpen && selectedCategory && (
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
                  setIsEditCategoryModalOpen(false);
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
      {isDeleteCategoryModalOpen && selectedCategory && (
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
                  setIsDeleteCategoryModalOpen(false);
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

export default SchoolSettings;
