import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { updatePaymentReminder } from '../api';
import { Student } from '../types';
import { useAppContext } from '../../../providers/AppContext';
import { FiBell, FiCalendar, FiMessageSquare, FiX, FiCheck, FiEdit3 } from 'react-icons/fi';

interface PaymentReminderCardProps {
  student: Student;
  onUpdate?: () => void;
}

const PaymentReminderCard: React.FC<PaymentReminderCardProps> = ({ student, onUpdate }) => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [reminderDate, setReminderDate] = useState(
    student.paymentReminderDate ? student.paymentReminderDate.split('T')[0] : ''
  );
  const [remarks, setRemarks] = useState(student.paymentRemainderRemarks || '');

  // Get today's date in YYYY-MM-DD format for min date validation
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const updateMutation = useMutation(
    (data: { paymentReminderDate?: string | null; paymentRemainderRemarks?: string | null }) =>
      updatePaymentReminder(student.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['student', student.id.toString()]);
        queryClient.invalidateQueries(['paymentReminders']);
        showToast({ message: 'Payment reminder updated successfully', type: 'SUCCESS' });
        setIsEditing(false);
        if (onUpdate) onUpdate();
      },
      onError: (error: Error) => {
        showToast({ message: error.message || 'Failed to update payment reminder', type: 'ERROR' });
      },
    }
  );

  const handleSave = () => {
    // Validate that date is not in the past
    if (reminderDate) {
      const selectedDate = new Date(reminderDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        showToast({ 
          message: 'Cannot set payment reminder for past dates. Please select today or a future date.', 
          type: 'ERROR' 
        });
        return;
      }
    }

    const data: { paymentReminderDate?: string | null; paymentRemainderRemarks?: string | null } = {};
    
    if (reminderDate) {
      data.paymentReminderDate = reminderDate;
    } else {
      data.paymentReminderDate = null;
    }
    
    if (remarks.trim()) {
      data.paymentRemainderRemarks = remarks.trim();
    } else {
      data.paymentRemainderRemarks = null;
    }

    updateMutation.mutate(data);
  };

  const handleClear = () => {
    updateMutation.mutate({
      paymentReminderDate: null,
      paymentRemainderRemarks: null,
    });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isReminderActive = student.paymentReminderDate && new Date(student.paymentReminderDate) <= new Date();

  if (!isEditing && !student.paymentReminderDate && !student.paymentRemainderRemarks) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FiBell className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Reminder</h3>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FiEdit3 className="h-4 w-4" />
            <span>Set Reminder</span>
          </button>
        </div>
        <p className="text-gray-500 text-sm">No payment reminder set for this student.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isReminderActive ? 'bg-red-100' : 'bg-blue-100'}`}>
            <FiBell className={`h-5 w-5 ${isReminderActive ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Reminder</h3>
            {isReminderActive && (
              <p className="text-sm text-red-600 font-medium">Action Required</p>
            )}
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FiEdit3 className="h-4 w-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline h-4 w-4 mr-1" />
              Reminder Date
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={getTodayDate()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to clear reminder. Select today or a future date. Reminders with dates on or before today will appear in the Payment Reminder dashboard.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMessageSquare className="inline h-4 w-4 mr-1" />
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add any notes about the payment reminder..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleClear}
              disabled={updateMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiX className="h-4 w-4" />
              <span>Clear Reminder</span>
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setReminderDate(student.paymentReminderDate ? student.paymentReminderDate.split('T')[0] : '');
                setRemarks(student.paymentRemainderRemarks || '');
              }}
              disabled={updateMutation.isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {student.paymentReminderDate && (
            <div className="flex items-start gap-3">
              <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Reminder Date</p>
                <p className="text-sm text-gray-900">{formatDate(student.paymentReminderDate)}</p>
                {isReminderActive && (
                  <p className="text-xs text-red-600 font-medium mt-1">Due for follow-up</p>
                )}
              </div>
            </div>
          )}

          {student.paymentRemainderRemarks && (
            <div className="flex items-start gap-3">
              <FiMessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Remarks</p>
                <p className="text-sm text-gray-900">{student.paymentRemainderRemarks}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentReminderCard;
