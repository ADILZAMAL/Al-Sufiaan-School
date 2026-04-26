import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes, FaChevronRight } from 'react-icons/fa';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { examEventApi } from '../api';
import { ExamEvent } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';

export default function ExamEventsPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ExamEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<ExamEvent | null>(null);
  const [formName, setFormName] = useState('');

  const { data: activeSession } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;

  const { data: events = [], isLoading } = useQuery<ExamEvent[]>(
    ['exam-events', selectedSessionId],
    () => examEventApi.list(selectedSessionId as number),
    { enabled: selectedSessionId !== null }
  );

  const createMutation = useMutation(
    () => examEventApi.create({ sessionId: selectedSessionId as number, name: formName }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-events', selectedSessionId]);
        setShowAddModal(false);
        setFormName('');
        showToast({ message: 'Exam event created successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const updateMutation = useMutation(
    () => examEventApi.update(editingEvent!.id, formName),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-events', selectedSessionId]);
        setEditingEvent(null);
        setFormName('');
        showToast({ message: 'Exam event updated successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => examEventApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-events', selectedSessionId]);
        setDeletingEvent(null);
        showToast({ message: 'Exam event deleted successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  // Keep session state when switching
  const handleSessionChange = (id: number) => {
    setManualSessionId(id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (editingEvent) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const subjectExamCount = (event: ExamEvent) => event.subjectExams?.length ?? 0;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Events</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage school-wide exams like Unit Tests, Terms, and Annual Examination
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
            <button
              onClick={() => { setShowAddModal(true); setFormName(''); }}
              disabled={selectedSessionId === null}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <FaPlus size={11} />
              Add Exam Event
            </button>
          </div>
        </div>

        {/* Content */}
        {selectedSessionId === null ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <p className="text-amber-700 font-medium text-sm">
              No active session found. Please create and activate a session first.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaPlus className="text-blue-300" size={18} />
            </div>
            <p className="text-gray-700 font-semibold">No exam events yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create exam events like "1st Unit Test", "Mid Term", or "Annual Examination"
            </p>
            <button
              onClick={() => { setShowAddModal(true); setFormName(''); }}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <FaPlus size={11} />
              Create First Exam Event
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {events.map((event, idx) => (
                <li
                  key={event.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 group transition cursor-pointer"
                  onClick={() => navigate(`/dashboard/academics/exam-events/${event.id}?sessionId=${selectedSessionId}&eventName=${encodeURIComponent(event.name)}`)}
                >
                  {/* Order number */}
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600">{idx + 1}</span>
                  </div>

                  {/* Event name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{event.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {subjectExamCount(event) > 0
                        ? `${subjectExamCount(event)} subject${subjectExamCount(event) === 1 ? '' : 's'} configured`
                        : 'No subjects configured yet'}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 hidden sm:block">
                    {subjectExamCount(event) > 0 ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        Configured
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Pending setup
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setEditingEvent(event); setFormName(event.name); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <HiOutlinePencil className="text-base" />
                    </button>
                    <button
                      onClick={() => setDeletingEvent(event)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>

                  <FaChevronRight className="text-gray-300 group-hover:text-blue-400 text-xs shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEvent ? 'Edit Exam Event' : 'Add Exam Event'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingEvent(null); setFormName(''); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. 1st Unit Test, Mid Term, Annual Examination"
                  required
                  autoFocus
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingEvent(null); setFormName(''); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingEvent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Exam Event?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deleting <span className="font-medium text-gray-700">"{deletingEvent.name}"</span> will remove all
              associated subject exams and student marks. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEvent(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingEvent.id)}
                disabled={deleteMutation.isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
