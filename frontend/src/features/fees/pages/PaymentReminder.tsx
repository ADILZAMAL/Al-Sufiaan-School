import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { getStudentsWithPaymentReminders } from '../../students/api';
import { Student } from '../../students/types';
import { FiBell, FiCalendar, FiMessageSquare, FiChevronRight, FiAlertCircle } from 'react-icons/fi';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
];

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDaysLabel = (dateString: string | undefined | null) => {
  if (!dateString) return null;
  const diff = Math.ceil(
    (new Date(dateString).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'bg-red-50 text-red-600' };
  if (diff === 0) return { label: 'Today', color: 'bg-yellow-50 text-yellow-700' };
  return { label: `In ${diff}d`, color: 'bg-blue-50 text-blue-600' };
};

const PaymentReminder: React.FC = () => {
  const navigate = useNavigate();

  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: ['paymentReminders'],
    queryFn: getStudentsWithPaymentReminders,
  });

  const overdueCount = students.filter((s: Student) => {
    if (!s.paymentReminderDate) return false;
    return new Date(s.paymentReminderDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  }).length;

  const todayCount = students.filter((s: Student) => {
    if (!s.paymentReminderDate) return false;
    return new Date(s.paymentReminderDate).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
  }).length;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-52 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="text-red-500 text-xl" />
            </div>
            <p className="text-gray-700 font-medium mb-4">
              {error instanceof Error ? error.message : 'Failed to load reminders'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Reminders</h1>
          <p className="text-sm text-gray-500 mt-1">Students whose parents need to be contacted for pending payments</p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FiBell className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-gray-800">{students.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <FiCalendar className="text-yellow-500 text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Today</p>
              <p className="text-xl font-bold text-gray-800">{todayCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <FiAlertCircle className="text-red-500 text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overdue</p>
              <p className="text-xl font-bold text-gray-800">{overdueCount}</p>
            </div>
          </div>
        </div>

        {/* ── List ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Reminder List</p>
          </div>

          {students.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <FiBell className="text-blue-400 text-2xl" />
              </div>
              <p className="text-sm font-medium text-gray-500">No payment reminders</p>
              <p className="text-xs text-gray-400 mt-1">Set reminders from student profile pages.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((student: Student) => {
                const fullName = `${student.firstName} ${student.lastName}`;
                const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
                const avatarColor = AVATAR_COLORS[fullName.charCodeAt(0) % 6];
                const daysTag = getDaysLabel(student.paymentReminderDate);

                return (
                  <div
                    key={student.id}
                    onClick={() => navigate(`/dashboard/students/${student.id}`)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${avatarColor}`}>
                      {initials}
                    </div>

                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{fullName}</p>
                        {daysTag && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${daysTag.color}`}>
                            {daysTag.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {student.admissionNumber}
                        {student.class?.name && ` · ${student.class.name}`}
                        {student.section?.name && ` · ${student.section.name}`}
                      </p>
                    </div>

                    {/* Reminder date */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                      <FiCalendar className="text-gray-300" />
                      {formatDate(student.paymentReminderDate)}
                    </div>

                    {/* Remarks */}
                    {student.paymentRemainderRemarks && (
                      <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 max-w-[200px] flex-shrink-0">
                        <FiMessageSquare className="text-gray-300 flex-shrink-0" />
                        <span className="truncate">{student.paymentRemainderRemarks}</span>
                      </div>
                    )}

                    {/* Arrow */}
                    <FiChevronRight className="text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentReminder;
