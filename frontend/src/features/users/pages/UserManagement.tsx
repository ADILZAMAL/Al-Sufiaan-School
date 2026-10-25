import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllUsers, disableLogin } from '../api';
import { User } from '../types';
import type { UserRole } from '../../auth/types';
import { useAppContext } from '../../../providers/AppContext';
import { ROLE_CONFIG, loginName } from '../roles';
import LoginFormModal from '../components/LoginFormModal';
import SetPasswordModal from '../components/SetPasswordModal';
import DisableLoginModal from '../components/DisableLoginModal';
import {
  FaUsers, FaShieldAlt, FaUserShield, FaUser, FaPlus, FaEdit, FaKey, FaUserSlash, FaChalkboardTeacher
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

type Dialog = { kind: 'add' } | { kind: 'edit' | 'password' | 'disable'; user: User } | null;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const UserManagement: React.FC = () => {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const { userId, showToast } = useAppContext();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery('users', getAllUsers);

  const closeAndRefresh = (message: string) => {
    setDialog(null);
    queryClient.invalidateQueries('users');
    showToast({ message, type: 'SUCCESS' });
  };

  const disableMutation = useMutation(disableLogin, {
    onSuccess: () => closeAndRefresh('Login disabled'),
    onError: (err: Error) => showToast({ message: err.message || 'Failed to disable login', type: 'ERROR' }),
  });

  const count = (role?: UserRole) => users?.filter((u) => !role || u.role === role).length ?? 0;
  const FILTERS: { role: UserRole | 'ALL'; label: string; chipClass: string; icon: React.ElementType }[] = [
    { role: 'ALL', label: 'All Logins', chipClass: 'bg-purple-50 text-purple-600', icon: FaUsers },
    { role: 'SUPER_ADMIN', label: 'Super Admins', chipClass: 'bg-red-50 text-red-600', icon: FaShieldAlt },
    { role: 'ADMIN', label: 'Admins', chipClass: 'bg-blue-50 text-blue-600', icon: FaUserShield },
    { role: 'CASHIER', label: 'Cashiers', chipClass: 'bg-emerald-50 text-emerald-600', icon: FaUser },
    { role: 'TEACHER', label: 'Teachers', chipClass: 'bg-amber-50 text-amber-600', icon: FaChalkboardTeacher },
  ];
  const visibleUsers = users?.filter((u) => roleFilter === 'ALL' || u.role === roleFilter) ?? [];

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
            <p className="text-sm text-gray-500 mt-1">
              Everyone who can sign in. Staff logins can also be managed from the staff profile.
            </p>
          </div>
          <button
            onClick={() => setDialog({ kind: 'add' })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="text-xs" /> Add User
          </button>
        </div>

        {/* Role filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {FILTERS.map(({ role, label, chipClass, icon: Icon }) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`bg-white rounded-xl border p-4 flex items-center gap-3 text-left transition-colors ${
                roleFilter === role ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${chipClass}`}>
                <Icon className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-xl font-bold text-gray-900">{count(role === 'ALL' ? undefined : role)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Login list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FaUsers className="text-blue-600 text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Logins</h2>
              <p className="text-xs text-gray-400">{visibleUsers.length} shown · sign in with mobile number</p>
            </div>
          </div>

          {visibleUsers.length === 0 ? (
            <div className="py-16 text-center">
              <FaUsers className="mx-auto text-3xl text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No logins found</p>
              <p className="text-xs text-gray-300 mt-1">Click "Add User" to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleUsers.map((user) => {
                const name = loginName(user);
                const isSelf = user.id === userId;
                const avatarColor = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
                const roleConfig = ROLE_CONFIG[user.role];
                return (
                  <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor}`}>
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                          {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">You</span>}
                          {user.staffId && (
                            <Link
                              to={`/dashboard/staff/view/${user.staffId}`}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                              title="Name and mobile number come from the staff record"
                            >
                              Staff →
                            </Link>
                          )}
                        </div>
                        {user.mobileNumber ? (
                          <p className="text-xs text-gray-400 truncate">
                            {user.mobileNumber}
                            {user.email && ` · ${user.email}`}
                            {' · '}
                            {user.lastLogin ? `last login ${new Date(user.lastLogin).toLocaleDateString('en-IN')}` : 'never logged in'}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 font-medium">Can't sign in: add a mobile number</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDialog({ kind: 'edit', user })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => setDialog({ kind: 'password', user })}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Reset password"
                            >
                              <FaKey className="text-sm" />
                            </button>
                            <button
                              onClick={() => setDialog({ kind: 'disable', user })}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Disable login"
                            >
                              <FaUserSlash className="text-sm" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dialog?.kind === 'add' && (
        <LoginFormModal mode="create" onClose={() => setDialog(null)} onSaved={() => closeAndRefresh('Login created')} />
      )}

      {dialog?.kind === 'edit' && (
        <LoginFormModal
          mode="edit"
          login={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={() => closeAndRefresh('Login updated')}
        />
      )}

      {dialog?.kind === 'password' && (
        <SetPasswordModal
          userId={dialog.user.id}
          name={loginName(dialog.user)}
          loginId={dialog.user.mobileNumber}
          onClose={() => setDialog(null)}
          onSuccess={() => closeAndRefresh('Password reset')}
        />
      )}

      {dialog?.kind === 'disable' && (
        <DisableLoginModal
          name={loginName(dialog.user)}
          loginId={dialog.user.mobileNumber}
          linkedToStaff={!!dialog.user.staffId}
          onClose={() => setDialog(null)}
          onConfirm={() => disableMutation.mutate(dialog.user.id)}
          isLoading={disableMutation.isLoading}
        />
      )}
    </div>
  );
};

export default UserManagement;
