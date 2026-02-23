import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { FaPlus } from 'react-icons/fa';
import { academicSessionApi } from '../api';
import { AcademicSession } from '../types';
import { fetchClasses, ClassType } from '../../class/api';
import { useAppContext } from '../../../providers/AppContext';

export default function SessionManagement() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [activatingSession, setActivatingSession] = useState<AcademicSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<AcademicSession | null>(null);

  // New session form state
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // Edit session form state
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const { data: sessions = [], isLoading } = useQuery<AcademicSession[]>(
    'sessions',
    academicSessionApi.getSessions
  );

  const { data: expandedClasses = [] } = useQuery<ClassType[]>(
    ['sessionClasses', expandedSessionId],
    () => fetchClasses(expandedSessionId!),
    { enabled: expandedSessionId !== null }
  );

  // Fetch session detail when editing to determine if dates can be changed
  const { data: editSessionDetail, isLoading: editDetailLoading } = useQuery<AcademicSession>(
    ['sessionDetail', editingSession?.id],
    () => academicSessionApi.getSessionById(editingSession!.id),
    { enabled: !!editingSession }
  );

  const canEditDates = !editDetailLoading && (editSessionDetail?.enrollmentCount ?? 0) === 0;

  const createMutation = useMutation(academicSessionApi.createSession, {
    onSuccess: () => {
      queryClient.invalidateQueries('sessions');
      setShowNewModal(false);
      setNewName('');
      setNewStartDate('');
      setNewEndDate('');
      showToast({ message: 'Session created successfully', type: 'SUCCESS' });
    },
    onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
  });

  const updateMutation = useMutation(
    ({ id, payload }: { id: number; payload: Partial<{ name: string; startDate: string; endDate: string }> }) =>
      academicSessionApi.updateSession(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sessions');
        setEditingSession(null);
        showToast({ message: 'Session updated successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const activateMutation = useMutation(
    (id: number) => academicSessionApi.activateSession(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sessions');
        queryClient.invalidateQueries('activeSession');
        setActivatingSession(null);
        showToast({ message: 'Session activated successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => academicSessionApi.deleteSession(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sessions');
        setDeletingSession(null);
        showToast({ message: 'Session deleted successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const handleToggleExpand = (sessionId: number) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const handleOpenEdit = (session: AcademicSession) => {
    setEditingSession(session);
    setEditName(session.name);
    setEditStartDate(session.startDate);
    setEditEndDate(session.endDate);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name: newName, startDate: newStartDate, endDate: newEndDate });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const payload: Partial<{ name: string; startDate: string; endDate: string }> = { name: editName };
    if (canEditDates) {
      payload.startDate = editStartDate;
      payload.endDate = editEndDate;
    }
    updateMutation.mutate({ id: editingSession.id, payload });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Session Management</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          <FaPlus />
          New Session
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No academic sessions found. Create your first session to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <React.Fragment key={session.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleExpand(session.id)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        {expandedSessionId === session.id ? <HiChevronDown /> : <HiChevronRight />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {session.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!session.isActive && (
                          <button
                            onClick={() => setActivatingSession(session)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(session)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        {!session.isActive && (
                          <button
                            onClick={() => setDeletingSession(session)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedSessionId === session.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                        <div className="text-sm font-semibold text-gray-700 mb-3">
                          Classes in {session.name}
                        </div>
                        {expandedClasses.length === 0 ? (
                          <p className="text-sm text-gray-500">No classes found for this session.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {expandedClasses.map((cls) => (
                              <div key={cls.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="font-medium text-gray-800 mb-2">{cls.name}</div>
                                {cls.sections && cls.sections.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {cls.sections.map((sec) => (
                                      <span
                                        key={sec.id}
                                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100"
                                      >
                                        {sec.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No sections</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">New Academic Session</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. 2026-27"
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    setNewName('');
                    setNewStartDate('');
                    setNewEndDate('');
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Session</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {editDetailLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  Checking session details...
                </div>
              ) : canEditDates ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      required
                      className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      required
                      className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Dates cannot be changed because this session has student enrollments. Only the name can be edited.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isLoading || editDetailLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {activatingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Activate Session</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to activate <strong>{activatingSession.name}</strong>? The currently
              active session will be deactivated.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActivatingSession(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => activateMutation.mutate(activatingSession.id)}
                disabled={activateMutation.isLoading}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
              >
                {activateMutation.isLoading ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Delete Session</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deletingSession.name}</strong>? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingSession(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingSession.id)}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
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
