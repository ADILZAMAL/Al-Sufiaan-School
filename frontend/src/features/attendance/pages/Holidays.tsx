import { useState, useEffect } from 'react';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday, type Holiday } from '../api/holiday';
import { useAppContext } from '../../../providers/AppContext';
import {
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaClock,
  FaCheckCircle,
  FaSun,
} from 'react-icons/fa';

type HolidayStatus = 'active' | 'upcoming' | 'past';

const STATUS_CONFIG: Record<HolidayStatus, { label: string; bg: string; text: string; dot: string; chipBg: string; chipText: string }> = {
  active: {
    label: 'Active',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    chipBg: 'bg-green-100',
    chipText: 'text-green-700',
  },
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-700',
  },
  past: {
    label: 'Past',
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    chipBg: 'bg-gray-100',
    chipText: 'text-gray-500',
  },
};

function getHolidayStatus(holiday: Holiday): HolidayStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(holiday.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(holiday.endDate);
  end.setHours(0, 0, 0, 0);
  if (today >= start && today <= end) return 'active';
  if (today < start) return 'upcoming';
  return 'past';
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-IN', { ...opts, year: 'numeric' });
  }
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })} – ${end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
  }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
}

export default function Holidays() {
  const { showToast } = useAppContext();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Holiday | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', name: '', reason: '' });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await getHolidays();
      setHolidays(data);
    } catch {
      showToast({ message: 'Failed to load holidays', type: 'ERROR' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, formData);
        showToast({ message: 'Holiday updated successfully', type: 'SUCCESS' });
      } else {
        await createHoliday(formData);
        showToast({ message: 'Holiday created successfully', type: 'SUCCESS' });
      }
      closeModal();
      fetchHolidays();
    } catch (error: any) {
      showToast({ message: error.message || 'Operation failed', type: 'ERROR' });
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      startDate: holiday.startDate.split('T')[0],
      endDate: holiday.endDate.split('T')[0],
      name: holiday.name,
      reason: holiday.reason || '',
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      await deleteHoliday(deleteModal.id);
      showToast({ message: 'Holiday deleted successfully', type: 'SUCCESS' });
      setDeleteModal(null);
      fetchHolidays();
    } catch {
      showToast({ message: 'Failed to delete holiday', type: 'ERROR' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHoliday(null);
    setFormData({ startDate: '', endDate: '', name: '', reason: '' });
  };

  // Stats
  const upcomingCount = holidays.filter(h => getHolidayStatus(h) === 'upcoming').length;
  const activeCount = holidays.filter(h => getHolidayStatus(h) === 'active').length;
  const totalDays = holidays.reduce((sum, h) => sum + calculateDays(h.startDate, h.endDate), 0);

  // Sort: active → upcoming → past; within each group sort by startDate asc
  const statusOrder: Record<HolidayStatus, number> = { active: 0, upcoming: 1, past: 2 };
  const sorted = [...holidays].sort((a, b) => {
    const sa = getHolidayStatus(a);
    const sb = getHolidayStatus(b);
    if (statusOrder[sa] !== statusOrder[sb]) return statusOrder[sa] - statusOrder[sb];
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const previewDays =
    formData.startDate && formData.endDate
      ? calculateDays(formData.startDate, formData.endDate)
      : null;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage school holidays and breaks</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Add Holiday
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Holidays', value: holidays.length, Icon: FaCalendarAlt, colorCls: 'bg-blue-50 text-blue-600' },
            { label: 'Upcoming', value: upcomingCount, Icon: FaClock, colorCls: 'bg-amber-50 text-amber-600' },
            { label: 'Active Now', value: activeCount, Icon: FaCheckCircle, colorCls: 'bg-green-50 text-green-600' },
            { label: 'Total Days Off', value: totalDays, Icon: FaSun, colorCls: 'bg-purple-50 text-purple-600' },
          ].map(({ label, value, Icon, colorCls }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorCls}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaCalendarAlt className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">No holidays yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Holiday" to create the first one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {sorted.map((holiday) => {
              const status = getHolidayStatus(holiday);
              const sc = STATUS_CONFIG[status];
              const days = calculateDays(holiday.startDate, holiday.endDate);
              const canEdit = status !== 'past';

              return (
                <div
                  key={holiday.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${status === 'past' ? 'opacity-55' : ''}`}
                >
                  {/* Date chip */}
                  <div className={`hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 ${sc.bg}`}>
                    <span className={`text-lg font-bold leading-none ${sc.text}`}>
                      {new Date(holiday.startDate).getDate()}
                    </span>
                    <span className={`text-xs font-medium uppercase ${sc.text}`}>
                      {new Date(holiday.startDate).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{holiday.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.chipBg} ${sc.chipText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDateRange(holiday.startDate, holiday.endDate)}
                    </p>
                    {holiday.reason && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{holiday.reason}</p>
                    )}
                  </div>

                  {/* Days badge */}
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.chipBg} ${sc.chipText}`}>
                    {days} {days === 1 ? 'day' : 'days'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(holiday)}
                      disabled={!canEdit}
                      title={!canEdit ? 'Cannot edit past holidays' : 'Edit'}
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModal(holiday)}
                      disabled={!canEdit}
                      title={!canEdit ? 'Cannot delete past holidays' : 'Delete'}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Holiday Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Republic Day, Summer Vacation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Reason{' '}
                    <span className="normal-case font-normal text-gray-300">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    placeholder="Optional reason or description"
                  />
                </div>

                {previewDays !== null && (
                  <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center gap-2">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">{previewDays}</span>{' '}
                      {previewDays === 1 ? 'day' : 'days'} off
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingHoliday ? 'Save Changes' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Delete Holiday</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800">"{deleteModal.name}"</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
