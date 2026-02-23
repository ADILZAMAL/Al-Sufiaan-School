import React from 'react';
import { User } from '../types';
import { HiOutlineExclamation } from 'react-icons/hi';

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, onConfirm, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamation className="text-red-600 text-xl" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Delete User</h3>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 mb-5">
          <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
