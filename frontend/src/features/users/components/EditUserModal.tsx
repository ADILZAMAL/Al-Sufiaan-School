import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { updateUser } from '../api';
import { User, UpdateUserData } from '../types';
import { FaTimes, FaEdit } from 'react-icons/fa';
import { HiOutlineExclamation } from 'react-icons/hi';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const inputErrorClass = 'w-full px-3 py-2.5 border border-red-300 bg-red-50 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UpdateUserData>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation(
    (data: UpdateUserData) => updateUser(user.id, data),
    {
      onSuccess: () => onSuccess(),
      onError: (error: any) => {
        if (error.message) setErrors({ general: error.message });
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FaEdit className="text-indigo-600 text-sm" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Edit User</h3>
              <p className="text-xs text-gray-400">{user.firstName} {user.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <HiOutlineExclamation className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                className={errors.firstName ? inputErrorClass : inputClass}
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                className={errors.lastName ? inputErrorClass : inputClass}
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={errors.email ? inputErrorClass : inputClass}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <select name="role" value={formData.role || ''} onChange={handleChange} className={inputClass}>
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updateMutation.isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
