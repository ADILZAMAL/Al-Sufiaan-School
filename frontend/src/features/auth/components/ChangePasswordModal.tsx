import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import {changePassword} from '../../users/api';
import { useAppContext } from '../../../providers/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordFormData } from '../types';

type ChangePasswordModalProps = {
    isOpen: boolean;
    onClose: () => void;
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
            await queryClient.invalidateQueries("validateToken");
            setLoading(false);
            onClose();
            navigate("/sign-in");
        },
        onError: (error: any) => {
            showToast({ message: error.message, type: 'ERROR' });
            setLoading(false);
        }
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

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">
                    Change Password
                </h3>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <input
                            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Old Password"
                            type="password"
                            {...register('oldPassword', { required: 'Old Password is required', minLength: { value: 6, message: 'Old Password must be at least 6 characters' } })}
                        />
                        {errors.oldPassword && <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message as string}</p>}
                        <input
                            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="New Password"
                            type="password"
                            {...register('newPassword', { required: 'New Password is required', minLength: { value: 6, message: 'New Password must be at least 6 characters' } })}
                        />
                        {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message as string}</p>}
                        <input
                            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm Password"
                            type="password"
                            {...register('confirmPassword', { required: 'Confirm Password is required', minLength: { value: 6, message: 'Confirm Password must be at least 6 characters' } })}
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                            disabled={loading}
                        >
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
