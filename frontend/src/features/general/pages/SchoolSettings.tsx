import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { getCurrentSchool, updateSchool, School } from '../../../api/school';
import { useAppContext } from '../../../providers/AppContext';
import { HiCheck, HiPlus, HiX } from 'react-icons/hi';

const SchoolSettings: React.FC = () => {
  const { showToast } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<School>>({});
  const [newPaymentMode, setNewPaymentMode] = useState('');

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
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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
          <div>
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
    </div>
  );
};

export default SchoolSettings;
