import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { changePassword } from '../api';
import { useAppContext } from '../../../providers/AppContext';

const ChangePassword = () => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { showToast } = useAppContext();

    const mutation = useMutation(changePassword, {
        onSuccess: () => {
            showToast({ message: 'Password changed successfully', type: 'SUCCESS' });
            setLoading(false);
        },
        onError: (error: any) => {
            showToast({ message: error.message, type: 'ERROR' });
            setLoading(false);
        }
    });

    const onSubmit = (data: any) => {
        if (data.newPassword !== data.confirmPassword) {
            showToast({ message: "Passwords don't match", type: 'ERROR' });
            return;
        }
        setLoading(true);
        mutation.mutate(data);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Change Password
                    </h2>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Old Password</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    {...register('oldPassword', { required: 'Old Password is required', minLength: { value: 6, message: 'Old Password must be at least 6 characters' } })}
                                />
                                {errors.oldPassword && <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message as string}</p>}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">New Password</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    {...register('newPassword', { required: 'New Password is required', minLength: { value: 6, message: 'New Password must be at least 6 characters' } })}
                                />
                                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message as string}</p>}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Confirm Password</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    {...register('confirmPassword', { required: 'Confirm Password is required', minLength: { value: 6, message: 'Confirm Password must be at least 6 characters' } })}
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
                            </div>
                        </div>
                        <div className="mt-4">
                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
