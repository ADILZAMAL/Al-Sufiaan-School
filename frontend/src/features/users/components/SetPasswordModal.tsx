import React, { useState } from 'react';
import { HiX, HiDeviceMobile } from 'react-icons/hi';
import PasswordFields from './PasswordFields';
import { passwordProblem } from '../../auth/utils/passwordRules';
import { resetLoginPassword } from '../api';

interface SetPasswordModalProps {
  userId: number;
  name: string;
  loginId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/** Reset someone else's password (own password: Change Password in the sidebar). */
const SetPasswordModal: React.FC<SetPasswordModalProps> = ({ userId, name, loginId, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password, confirmPassword);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await resetLoginPassword(userId, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Reset Password — {name}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <HiDeviceMobile className="text-blue-500 w-4 h-4 shrink-0" />
            <p className="text-sm text-blue-700">
              {loginId
                ? <>Signs in with mobile number <span className="font-semibold">{loginId}</span></>
                : 'No mobile number yet: add one (Edit) so they can sign in'}
            </p>
          </div>

          <PasswordFields
            label="New Password"
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            disabled={isLoading}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {isLoading ? 'Saving…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordModal;
