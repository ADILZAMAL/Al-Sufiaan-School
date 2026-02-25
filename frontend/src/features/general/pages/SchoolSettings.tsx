import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getCurrentSchool, updateSchool, School } from '../../../api/school';
import { useAppContext } from '../../../providers/AppContext';
import { HiCheck, HiPlus, HiX, HiOutlineExclamation } from 'react-icons/hi';
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaBuilding, FaMapMarkerAlt,
  FaCreditCard, FaPhone, FaBus, FaTags, FaMoneyBillWave,
  FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
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

type TabId = 'school' | 'tuition' | 'transportation' | 'expenses';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'school', label: 'School Info', icon: FaBuilding },
  { id: 'tuition', label: 'Tuition Fees', icon: FaMoneyBillWave },
  { id: 'transportation', label: 'Transportation', icon: FaBus },
  { id: 'expenses', label: 'Expense Categories', icon: FaTags },
];

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const sectionLabelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4';

const SchoolSettings: React.FC = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('school');
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

  // Transportation Area Pricing hooks
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
  } = useTransportationAreaPricingManager({ page: 1, limit: 1000 });

  const [showTransportationForm, setShowTransportationForm] = useState(false);
  const [editingTransportationPricing, setEditingTransportationPricing] = useState<any>(null);
  const [deletingTransportationId, setDeletingTransportationId] = useState<number | null>(null);
  const [transportationFormData, setTransportationFormData] = useState({
    areaName: '',
    price: '',
    academicYear: transportationUtils.getCurrentAcademicYear(),
    description: '',
    displayOrder: '0',
  });

  const academicYearOptions = useMemo(() => {
    return transportationUtils.generateAcademicYears(2024, 5);
  }, [transportationUtils]);

  // Fetch expense categories
  const { data: expenseCategories = [], isLoading: isLoadingExpenseCategories, error: expenseCategoriesError } = useQuery(
    'expenseCategories',
    () => apiClient.fetchExpenseCategories(),
    { staleTime: 5 * 60 * 1000 }
  );

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

  const updateCategoryMutation = useMutation(
    ({ id, name }: { id: number; name: string }) => apiClient.updateExpenseCategory(id, { name }),
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
      onSuccess: (data: School) => { setFormData(data); },
      onError: (error: Error) => { showToast({ message: error.message, type: 'ERROR' }); },
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
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number' && value !== '') {
      const numValue = parseFloat(value);
      const roundedValue = Math.round(numValue * 100) / 100;
      setFormData({ ...formData, [name]: roundedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (school?.id) {
      updateMutation.mutate({ id: school.id, data: formData });
    }
  };

  const handleCancel = () => {
    if (school) setFormData(school);
    setNewPaymentMode('');
    setIsEditing(false);
  };

  const handleAddPaymentMode = () => {
    if (newPaymentMode.trim()) {
      const currentModes = formData.paymentModes || [];
      if (!currentModes.includes(newPaymentMode.trim())) {
        setFormData({ ...formData, paymentModes: [...currentModes, newPaymentMode.trim()] });
      }
      setNewPaymentMode('');
    }
  };

  const handleRemovePaymentMode = (mode: string) => {
    const currentModes = formData.paymentModes || [];
    setFormData({ ...formData, paymentModes: currentModes.filter(m => m !== mode) });
  };

  const handlePaymentModeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddPaymentMode(); }
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
        setPricingFormData({ classId: '', amount: '', academicYear: utils.getCurrentAcademicYear() });
        showToast({ message: 'Class pricing created successfully!', type: 'SUCCESS' });
      },
      onError: (error: any) => {
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
            setTransportationFormData({ areaName: '', price: '', academicYear: transportationUtils.getCurrentAcademicYear(), description: '', displayOrder: '0' });
            showToast({ message: 'Transportation pricing updated successfully!', type: 'SUCCESS' });
          },
          onError: (error: any) => {
            showToast({ message: error.message || 'Failed to update transportation pricing', type: 'ERROR' });
          }
        });
      } else {
        createTransportationPricing(data as CreateTransportationAreaPricingRequest, {
          onSuccess: () => {
            setShowTransportationForm(false);
            setTransportationFormData({ areaName: '', price: '', academicYear: transportationUtils.getCurrentAcademicYear(), description: '', displayOrder: '0' });
            showToast({ message: 'Transportation pricing created successfully!', type: 'SUCCESS' });
          },
          onError: (error: any) => {
            showToast({ message: error.message || 'Failed to create transportation pricing', type: 'ERROR' });
          }
        });
      }
    } catch (error) {
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

  const handleConfirmDeleteTransportation = () => {
    if (deletingTransportationId === null) return;
    deleteTransportationPricing(deletingTransportationId, {
      onSuccess: () => {
        setDeletingTransportationId(null);
        showToast({ message: 'Transportation pricing deleted successfully!', type: 'SUCCESS' });
      },
      onError: (error: any) => {
        setDeletingTransportationId(null);
        showToast({ message: error.message || 'Failed to delete transportation pricing', type: 'ERROR' });
      }
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) addCategoryMutation.mutate(newCategoryName.trim().toUpperCase());
  };

  const handleEditCategory = () => {
    if (selectedCategory && editCategoryName.trim()) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, name: editCategoryName.trim().toUpperCase() });
    }
  };

  const handleDeleteCategory = () => {
    if (selectedCategory) deleteCategoryMutation.mutate(selectedCategory.id);
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
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading school settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage school information, fees, transportation and expense categories</p>
        </div>

        {/* Tab Pills */}
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1 flex-wrap">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="text-xs" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── School Info Tab ── */}
        {activeTab === 'school' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FaBuilding className="text-blue-600 text-sm" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">School Information</h2>
                  <p className="text-xs text-gray-400">Update school details and configuration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaEdit className="text-xs" /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={updateMutation.isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <HiCheck className="text-base" />
                      {updateMutation.isLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <div>
                <p className={sectionLabelClass}>Basic Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>School Name</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>SID (School ID)</label>
                    <input type="text" name="sid" value={formData.sid || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>UDICE Code</label>
                    <input type="text" name="udiceCode" value={formData.udiceCode || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      name="active"
                      value={formData.active ? 'true' : 'false'}
                      onChange={(e) => handleChange({ target: { name: 'active', value: e.target.value === 'true', type: 'checkbox', checked: e.target.value === 'true' } } as any)}
                      disabled={!isEditing}
                      className={inputClass}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className={sectionLabelClass}>
                  <span className="inline-flex items-center gap-1.5"><FaMapMarkerAlt />Address</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Street</label>
                    <input type="text" name="street" value={formData.street || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>City</label>
                      <input type="text" name="city" value={formData.city || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>District</label>
                      <input type="text" name="district" value={formData.district || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input type="text" name="state" value={formData.state || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Pincode</label>
                      <input type="text" name="pincode" value={formData.pincode || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className={sectionLabelClass}>
                  <span className="inline-flex items-center gap-1.5"><FaPhone />Contact</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Mobile Number</label>
                    <input type="text" name="mobile" value={formData.mobile || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Payment Modes */}
              <div>
                <p className={sectionLabelClass}>
                  <span className="inline-flex items-center gap-1.5"><FaCreditCard />Payment Modes</span>
                </p>
                <div className="space-y-3">
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPaymentMode}
                        onChange={(e) => setNewPaymentMode(e.target.value)}
                        onKeyPress={handlePaymentModeKeyPress}
                        placeholder="e.g., Google Pay, PhonePe"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleAddPaymentMode}
                        disabled={!newPaymentMode.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <HiPlus className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(formData.paymentModes || []).length > 0 ? (
                      (formData.paymentModes || []).map((mode) => (
                        <span
                          key={mode}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100"
                        >
                          {mode}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentMode(mode)}
                              className="text-blue-400 hover:text-blue-700 transition-colors"
                            >
                              <HiX className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">No payment modes configured</p>
                    )}
                  </div>
                  {(formData.paymentModes || []).length === 0 && (
                    <p className="text-xs text-amber-600">At least one payment mode should be configured</p>
                  )}
                </div>
              </div>

              {/* Fee Structure */}
              <div>
                <p className={sectionLabelClass}>
                  <span className="inline-flex items-center gap-1.5"><FaMoneyBillWave />Fee Structure</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'hostelFee', label: 'Hostel Fee', hint: 'Leave empty if no hostel facility' },
                    { name: 'admissionFee', label: 'Admission Fee', hint: 'One-time fee for new students' },
                    { name: 'dayboardingFee', label: 'Dayboarding Fee', hint: 'For students opting in' },
                  ].map(({ name, label, hint }) => (
                    <div key={name}>
                      <label className={labelClass}>{label} (₹)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">₹</span>
                        <input
                          type="number"
                          name={name}
                          value={(formData as any)[name] || ''}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="—"
                          className={`${inputClass} pl-7`}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                Last updated: {school?.updatedAt ? new Date(school.updatedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* ── Tuition Fees Tab ── */}
        {activeTab === 'tuition' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FaMoneyBillWave className="text-emerald-600 text-sm" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Class Tuition Fee Pricing</h2>
                  <p className="text-xs text-gray-400">Set monthly tuition fees by class and academic year</p>
                </div>
              </div>
              <button
                onClick={() => setShowPricingForm(!showPricingForm)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                  showPricingForm
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showPricingForm
                  ? <><FaTimes className="text-xs" /> Cancel</>
                  : <><FaPlus className="text-xs" /> Add Pricing</>
                }
              </button>
            </div>

            {/* Add Pricing Form */}
            {showPricingForm && (
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <p className={sectionLabelClass}>New Tuition Fee Entry</p>

                {!!createError && (
                  <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <HiOutlineExclamation className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{createError instanceof Error ? createError.message : String(createError)}</p>
                  </div>
                )}

                <form onSubmit={handlePricingSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className={labelClass}>Class</label>
                    <select
                      value={pricingFormData.classId}
                      onChange={(e) => setPricingFormData({ ...pricingFormData, classId: e.target.value })}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">₹</span>
                      <input
                        type="number"
                        value={pricingFormData.amount}
                        onChange={(e) => setPricingFormData({ ...pricingFormData, amount: e.target.value })}
                        className={`${inputClass} pl-7`}
                        placeholder="Enter amount"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Academic Year</label>
                    <select
                      value={pricingFormData.academicYear}
                      onChange={(e) => setPricingFormData({ ...pricingFormData, academicYear: e.target.value })}
                      className={inputClass}
                      required
                    >
                      {utils.generateAcademicYears().map((year) => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isCreating ? 'Creating…' : 'Create Pricing'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isLoadingPricing ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : classFeePricing.length === 0 ? (
              <div className="py-16 text-center">
                <FaMoneyBillWave className="mx-auto text-3xl text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No tuition fee pricing configured yet</p>
                <p className="text-xs text-gray-300 mt-1">Click "Add Pricing" above to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Class', 'Fee Type', 'Amount', 'Academic Year', 'Status'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classFeePricing.map((pricing) => (
                      <tr key={pricing.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{pricing.class?.name || 'Unknown Class'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">Tuition Fee</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{utils.formatAmount(pricing.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{pricing.academicYear}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                            pricing.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {pricing.isActive ? <FaCheckCircle className="text-xs" /> : <FaTimesCircle className="text-xs" />}
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
        )}

        {/* ── Transportation Tab ── */}
        {activeTab === 'transportation' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FaBus className="text-purple-600 text-sm" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Transportation Area Pricing</h2>
                  <p className="text-xs text-gray-400">Manage transport fees by area and academic year</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingTransportationPricing(null);
                  setTransportationFormData({ areaName: '', price: '', academicYear: transportationUtils.getCurrentAcademicYear(), description: '', displayOrder: '0' });
                  setShowTransportationForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-xs" /> Add Pricing
              </button>
            </div>

            {isLoadingTransportation ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : transportationAreaPricing.length === 0 ? (
              <div className="py-16 text-center">
                <FaBus className="mx-auto text-3xl text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No transportation pricing configured yet</p>
                <p className="text-xs text-gray-300 mt-1">Click "Add Pricing" above to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Area', 'Transport Fee', 'Academic Year', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transportationAreaPricing.map((pricing) => {
                      const status = transportationUtils.getPricingStatus(pricing);
                      const statusColor = transportationUtils.getStatusColor(status);
                      return (
                        <tr key={pricing.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{pricing.areaName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{transportationUtils.formatCurrency(pricing.price)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{pricing.academicYear}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditTransportation(pricing)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                onClick={() => setDeletingTransportationId(pricing.id)}
                                disabled={isDeletingTransportation}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                title="Delete"
                              >
                                <FaTrash className="text-sm" />
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
        )}

        {/* ── Expense Categories Tab ── */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <FaTags className="text-orange-600 text-sm" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Expense Categories</h2>
                  <p className="text-xs text-gray-400">Create and manage expense categories for your school</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCategoryModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-xs" /> Add Category
              </button>
            </div>

            {isLoadingExpenseCategories ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : expenseCategoriesError ? (
              <div className="p-6">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <HiOutlineExclamation className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {expenseCategoriesError instanceof Error ? expenseCategoriesError.message : 'Failed to load expense categories'}
                  </p>
                </div>
              </div>
            ) : expenseCategories.length === 0 ? (
              <div className="py-16 text-center">
                <FaTags className="mx-auto text-3xl text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No expense categories yet</p>
                <p className="text-xs text-gray-300 mt-1">Click "Add Category" above to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        <FaTags className="text-orange-400 text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          category.isActive ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {category.isActive
                            ? <><FaCheckCircle className="text-xs" /> Active</>
                            : <><FaTimesCircle className="text-xs" /> Inactive</>
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => openDeleteCategoryModal(category)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Transportation Form Modal ── */}
      {showTransportationForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editingTransportationPricing ? 'Edit Transportation Pricing' : 'Add Transportation Pricing'}
              </h3>
              <button
                onClick={() => { setShowTransportationForm(false); setEditingTransportationPricing(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleTransportationSubmit} className="p-6 space-y-4">
              {!!(createTransportationError || updateTransportationError) && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <HiOutlineExclamation className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {(createTransportationError instanceof Error ? createTransportationError.message : String(createTransportationError)) ||
                      (updateTransportationError instanceof Error ? updateTransportationError.message : String(updateTransportationError)) ||
                      'An unexpected error occurred'}
                  </p>
                </div>
              )}

              <div>
                <label className={labelClass}>Area Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={transportationFormData.areaName}
                  onChange={(e) => setTransportationFormData(prev => ({ ...prev, areaName: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Transport Fee (₹) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={transportationFormData.price}
                    onChange={(e) => setTransportationFormData(prev => ({ ...prev, price: e.target.value }))}
                    className={`${inputClass} pl-7`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Academic Year <span className="text-red-500">*</span></label>
                <select
                  value={transportationFormData.academicYear}
                  onChange={(e) => setTransportationFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYearOptions.map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={transportationFormData.description}
                  onChange={(e) => setTransportationFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={transportationFormData.displayOrder}
                  onChange={(e) => setTransportationFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowTransportationForm(false); setEditingTransportationPricing(null); }}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTransportation || isUpdatingTransportation}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isCreatingTransportation || isUpdatingTransportation ? 'Saving…' : editingTransportationPricing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Transportation Delete Confirm Modal ── */}
      {deletingTransportationId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HiOutlineExclamation className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Pricing</h3>
                <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this transportation area pricing? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTransportationId(null)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteTransportation}
                disabled={isDeletingTransportation}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeletingTransportation ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ── */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">Add Expense Category</h3>
              <button
                onClick={() => { setIsAddCategoryModalOpen(false); setNewCategoryName(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Category Name</label>
              <input
                type="text"
                placeholder="e.g., SALARIES, MAINTENANCE"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className={inputClass}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Will be saved in uppercase</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsAddCategoryModalOpen(false); setNewCategoryName(''); }}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || addCategoryMutation.isLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addCategoryMutation.isLoading ? 'Adding…' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Category Modal ── */}
      {isEditCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">Edit Category</h3>
              <button
                onClick={() => { setIsEditCategoryModalOpen(false); setSelectedCategory(null); setEditCategoryName(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Category Name</label>
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                className={inputClass}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Will be saved in uppercase</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditCategoryModalOpen(false); setSelectedCategory(null); setEditCategoryName(''); }}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                disabled={!editCategoryName.trim() || updateCategoryMutation.isLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updateCategoryMutation.isLoading ? 'Updating…' : 'Update Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Category Modal ── */}
      {isDeleteCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HiOutlineExclamation className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-gray-700">"{selectedCategory.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsDeleteCategoryModalOpen(false); setSelectedCategory(null); }}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={deleteCategoryMutation.isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteCategoryMutation.isLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolSettings;
