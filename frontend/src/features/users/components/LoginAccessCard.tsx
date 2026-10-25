import React, { useState } from 'react';
import { HiLockClosed, HiLockOpen } from 'react-icons/hi';
import { useAppContext } from '../../../providers/AppContext';
import type { Staff } from '../../staff/types';
import { disableLogin } from '../api';
import { LoginSummary } from '../types';
import { ROLE_CONFIG, canManageRole } from '../roles';
import LoginFormModal from './LoginFormModal';
import SetPasswordModal from './SetPasswordModal';
import DisableLoginModal from './DisableLoginModal';

interface LoginAccessCardProps {
  staff: Staff;
  /** Called after any change so the page can reload the staff record */
  onChange: () => void;
}

/** Login section of the staff profile; the same login is also listed in User Management. */
const LoginAccessCard: React.FC<LoginAccessCardProps> = ({ staff, onChange }) => {
  const { userRole, userId, showToast } = useAppContext();
  const [modal, setModal] = useState<'enable' | 'role' | 'password' | 'disable' | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  const status = staff.loginStatus;
  const login: LoginSummary | null = status?.enabled && status.userId && status.role
    ? {
        id: status.userId,
        role: status.role,
        staffId: staff.id!,
        staff: { id: staff.id!, name: staff.name, mobileNumber: staff.mobileNumber },
        firstName: staff.name,
        lastName: null,
        mobileNumber: status.mobileNumber,
        email: null,
      }
    : null;
  const isSelf = !!login && login.id === userId;
  const canManage = !isSelf && canManageRole(userRole, login?.role ?? 'TEACHER');

  const finish = (message: string) => {
    setModal(null);
    showToast({ message, type: 'SUCCESS' });
    onChange();
  };

  const handleDisable = async () => {
    if (!login) return;
    setIsDisabling(true);
    try {
      await disableLogin(login.id);
      finish('Login disabled');
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : 'Failed to disable login', type: 'ERROR' });
    } finally {
      setIsDisabling(false);
    }
  };

  const buttonClass = 'inline-flex items-center px-3 py-1.5 border text-sm rounded-md transition';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {login
            ? <HiLockOpen className="h-5 w-5 mr-2 text-green-600" />
            : <HiLockClosed className="h-5 w-5 mr-2 text-gray-400" />}
          Login Access
        </h3>
        <div className="flex items-center gap-2">
          {login ? (
            <>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_CONFIG[login.role].color}`}>
                {ROLE_CONFIG[login.role].label}
              </span>
              {canManage && (
                <>
                  <button onClick={() => setModal('password')} className={`${buttonClass} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                    Reset Password
                  </button>
                  {userRole === 'SUPER_ADMIN' && (
                    <button onClick={() => setModal('role')} className={`${buttonClass} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                      Change Role
                    </button>
                  )}
                  <button onClick={() => setModal('disable')} className={`${buttonClass} border-red-300 text-red-600 hover:bg-red-50`}>
                    Disable Login
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">No Login</span>
              {canManage && staff.active !== false && (
                <button
                  onClick={() => setModal('enable')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition"
                >
                  Enable Login
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {login ? (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
          <p>
            Signs in with mobile number <span className="font-medium text-gray-900">{login.mobileNumber}</span>
            {' '}to the {login.role === 'TEACHER' ? 'mobile app' : 'website'}
          </p>
          <p>
            Last login:{' '}
            <span className="font-medium text-gray-900">
              {status?.lastLogin ? new Date(status.lastLogin).toLocaleString('en-IN') : 'Never logged in'}
            </span>
          </p>
          {isSelf && <p className="text-xs text-gray-400">This is your own login. Use Change Password in the sidebar.</p>}
          {!isSelf && !canManage && <p className="text-xs text-gray-400">Only a Super Admin can change this login.</p>}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          {staff.active === false
            ? 'This staff member has left school, so they have no login.'
            : 'No login yet. Enable it to let them sign in (teachers use the mobile app).'}
        </div>
      )}

      {modal === 'enable' && (
        <LoginFormModal
          mode="create"
          staff={{ id: staff.id!, name: staff.name, mobileNumber: staff.mobileNumber }}
          fromStaffProfile
          onClose={() => setModal(null)}
          onSaved={() => finish('Login enabled')}
        />
      )}
      {modal === 'role' && login && (
        <LoginFormModal
          mode="edit"
          login={login}
          fromStaffProfile
          onClose={() => setModal(null)}
          onSaved={() => finish('Role updated')}
        />
      )}
      {modal === 'password' && login && (
        <SetPasswordModal
          userId={login.id}
          name={staff.name}
          loginId={login.mobileNumber}
          onClose={() => setModal(null)}
          onSuccess={() => finish('Password reset')}
        />
      )}
      {modal === 'disable' && login && (
        <DisableLoginModal
          name={staff.name}
          loginId={login.mobileNumber}
          linkedToStaff
          onClose={() => setModal(null)}
          onConfirm={handleDisable}
          isLoading={isDisabling}
        />
      )}
    </div>
  );
};

export default LoginAccessCard;
