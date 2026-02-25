import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllUsers, deleteUser } from '../api';
import { User } from '../types';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import DeleteUserModal from '../components/DeleteUserModal';
import {
  FaUsers, FaShieldAlt, FaUserShield, FaUser, FaPlus, FaEdit, FaTrash
} from 'react-icons/fa';
import { HiOutlineExclamation } from 'react-icons/hi';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  CASHIER: { label: 'Cashier', color: 'bg-emerald-100 text-emerald-700' },
};

const UserManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery('users', getAllUsers);

  const deleteMutation = useMutation(deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
  });

  const handleEdit = (user: User) => { setSelectedUser(user); setShowEditModal(true); };
  const handleDelete = (user: User) => { setSelectedUser(user); setShowDeleteModal(true); };

  const STATS = [
    { label: 'Total Users', value: users?.length ?? 0, chipClass: 'bg-purple-50 text-purple-600', icon: FaUsers },
    { label: 'Super Admins', value: users?.filter(u => u.role === 'SUPER_ADMIN').length ?? 0, chipClass: 'bg-red-50 text-red-600', icon: FaShieldAlt },
    { label: 'Admins', value: users?.filter(u => u.role === 'ADMIN').length ?? 0, chipClass: 'bg-blue-50 text-blue-600', icon: FaUserShield },
    { label: 'Cashiers', value: users?.filter(u => u.role === 'CASHIER').length ?? 0, chipClass: 'bg-emerald-50 text-emerald-600', icon: FaUser },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading users…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <HiOutlineExclamation className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage system users and access levels</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="text-xs" /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ label, value, chipClass, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${chipClass}`}>
                <Icon className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FaUsers className="text-blue-600 text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All Users</h2>
              <p className="text-xs text-gray-400">{users?.length ?? 0} registered users</p>
            </div>
          </div>

          {users?.length === 0 ? (
            <div className="py-16 text-center">
              <FaUsers className="mx-auto text-3xl text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No users found</p>
              <p className="text-xs text-gray-300 mt-1">Click "Add User" to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users?.map((user) => {
                const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
                const avatarColor = AVATAR_COLORS[(user.firstName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
                const roleConfig = ROLE_CONFIG[user.role] ?? { label: user.role, color: 'bg-gray-100 text-gray-700' };
                return (
                  <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="hidden md:block text-xs text-gray-400 max-w-[120px] truncate">{user.School?.name || '—'}</span>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); queryClient.invalidateQueries('users'); }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedUser(null); queryClient.invalidateQueries('users'); }}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}
          onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default UserManagement;
