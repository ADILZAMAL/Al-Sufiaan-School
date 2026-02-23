import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { FaTimes, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { changePassword } from '../../users/api';
import { useAppContext } from '../../../providers/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordFormData } from '../types';

type ChangePasswordModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const PasswordInput = ({
    placeholder,
    registration,
    error,
}: {
    placeholder: string;
    registration: object;
    error?: string;
}) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    {...registration}
                />
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                >
                    {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordFormData>();
    const { showToast } = useAppContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation(changePassword, {
        onSuccess: async () => {
            showToast({ message: 'Password changed successfully', type: 'SUCCESS' });
            await queryClient.invalidateQueries('validateToken');
            setLoading(false);
            onClose();
            navigate('/sign-in');
        },
        onError: (error: any) => {
            showToast({ message: error.message, type: 'ERROR' });
            setLoading(false);
        },
    });

    const onSubmit = (data: ChangePasswordFormData) => {
        if (data.oldPassword === data.newPassword) {
            showToast({ message: 'New password cannot be the same as the old password', type: 'ERROR' });
            return;
        }
        if (data.newPassword !== data.confirmPassword) {
            showToast({ message: "Passwords don't match", type: 'ERROR' });
            return;
        }
        setLoading(true);
        mutation.mutate(data);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FaLock className="text-blue-600" size={15} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Change Password</h3>
                            <p className="text-xs text-gray-400 mt-0.5">You'll be signed out after changing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Current Password
                            </label>
                            <PasswordInput
                                placeholder="Enter current password"
                                registration={register('oldPassword', {
                                    required: 'Current password is required',
                                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                                })}
                                error={errors.oldPassword?.message as string}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                New Password
                            </label>
                            <PasswordInput
                                placeholder="Enter new password"
                                registration={register('newPassword', {
                                    required: 'New password is required',
                                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                                })}
                                error={errors.newPassword?.message as string}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Confirm New Password
                            </label>
                            <PasswordInput
                                placeholder="Re-enter new password"
                                registration={register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                                })}
                                error={errors.confirmPassword?.message as string}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ChangePasswordModal;
