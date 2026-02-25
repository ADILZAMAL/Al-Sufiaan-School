import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { academicSessionApi, enrollmentApi } from '../api';
import { AcademicSession, StudentEnrollment, EnrollStudentRequest } from '../types';
import { fetchClasses, ClassType } from '../../class/api';
import { useAppContext } from '../../../providers/AppContext';

export default function StudentPromotion() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  // Step 1: source selection
  const [sourceSessionId, setSourceSessionId] = useState<number | null>(null);
  const [sourceClassId, setSourceClassId] = useState<number | null>(null);
  const [sourceSectionId, setSourceSectionId] = useState<number | null>(null);

  // Promote modal state
  const [promotingEnrollment, setPromotingEnrollment] = useState<StudentEnrollment | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<number | null>(null);
  const [targetClassId, setTargetClassId] = useState<number | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
  const [targetRollNumber, setTargetRollNumber] = useState('');

  // Data fetching
  const { data: sessions = [] } = useQuery<AcademicSession[]>(
    'sessions',
    academicSessionApi.getSessions
  );

  const { data: sourceClasses = [] } = useQuery<ClassType[]>(
    ['sessionClasses', sourceSessionId],
    () => fetchClasses(sourceSessionId!),
    { enabled: !!sourceSessionId }
  );

  const sourceClass = sourceClasses.find((c) => c.id === sourceClassId);
  const sourceSections = sourceClass?.sections ?? [];

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<StudentEnrollment[]>(
    ['enrollments', sourceSessionId, sourceClassId, sourceSectionId],
    () =>
      enrollmentApi.getEnrollments(sourceSessionId!, {
        classId: sourceClassId ?? undefined,
        sectionId: sourceSectionId ?? undefined,
      }),
    { enabled: !!sourceSessionId && !!sourceClassId }
  );

  const { data: targetClasses = [] } = useQuery<ClassType[]>(
    ['sessionClasses', targetSessionId],
    () => fetchClasses(targetSessionId!),
    { enabled: !!targetSessionId }
  );

  const targetClass = targetClasses.find((c) => c.id === targetClassId);
  const targetSections = targetClass?.sections ?? [];

  const promoteMutation = useMutation(
    ({
      sessionId,
      data,
    }: {
      sessionId: number;
      data: EnrollStudentRequest;
    }) => enrollmentApi.enrollStudent(sessionId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['enrollments', sourceSessionId]);
        setPromotingEnrollment(null);
        resetModal();
        showToast({ message: 'Student promoted successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const resetModal = () => {
    setTargetSessionId(null);
    setTargetClassId(null);
    setTargetSectionId(null);
    setTargetRollNumber('');
  };

  const handleOpenPromote = (enrollment: StudentEnrollment) => {
    setPromotingEnrollment(enrollment);
    resetModal();
  };

  const handlePromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingEnrollment || !targetSessionId || !targetClassId || !targetSectionId) return;
    promoteMutation.mutate({
      sessionId: targetSessionId,
      data: {
        studentId: promotingEnrollment.studentId,
        classId: targetClassId,
        sectionId: targetSectionId,
        rollNumber: targetRollNumber || undefined,
      },
    });
  };

  const handleSourceSessionChange = (id: number) => {
    setSourceSessionId(id);
    setSourceClassId(null);
    setSourceSectionId(null);
  };

  const handleSourceClassChange = (id: number) => {
    setSourceClassId(id);
    setSourceSectionId(null);
  };

  const handleTargetSessionChange = (id: number) => {
    setTargetSessionId(id);
    setTargetClassId(null);
    setTargetSectionId(null);
  };

  const handleTargetClassChange = (id: number) => {
    setTargetClassId(id);
    setTargetSectionId(null);
  };

  const canSearch = !!sourceSessionId && !!sourceClassId;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Promotion</h1>

      {/* Step 1: Source Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Source</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={sourceSessionId ?? ''}
              onChange={(e) => handleSourceSessionChange(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isActive ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={sourceClassId ?? ''}
              onChange={(e) => handleSourceClassChange(Number(e.target.value))}
              disabled={!sourceSessionId}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select class</option>
              {sourceClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={sourceSectionId ?? ''}
              onChange={(e) =>
                setSourceSectionId(e.target.value ? Number(e.target.value) : null)
              }
              disabled={!sourceClassId}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All sections</option>
              {sourceSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      {!canSearch ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center text-amber-700 text-sm">
          Select a session and class above to view students for promotion.
        </div>
      ) : enrollmentsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No students found for the selected class/section.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">
              Students ({enrollments.length})
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {enrollment.student?.name ?? `Student #${enrollment.studentId}`}
                    </div>
                    {enrollment.student?.admissionNumber && (
                      <div className="text-xs text-gray-500">{enrollment.student.admissionNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {enrollment.class?.name ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {enrollment.section?.name ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {enrollment.rollNumber ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleOpenPromote(enrollment)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Promote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Promote Modal */}
      {promotingEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-1 text-gray-800">Promote Student</h2>
            <p className="text-sm text-gray-500 mb-4">
              {promotingEnrollment.student?.name ?? `Student #${promotingEnrollment.studentId}`}
            </p>

            <form onSubmit={handlePromoteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Session
                </label>
                <select
                  value={targetSessionId ?? ''}
                  onChange={(e) => handleTargetSessionChange(Number(e.target.value))}
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select session</option>
                  {sessions
                    .filter((s) => s.id !== sourceSessionId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.isActive ? ' (Active)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Class
                </label>
                <select
                  value={targetClassId ?? ''}
                  onChange={(e) => handleTargetClassChange(Number(e.target.value))}
                  disabled={!targetSessionId}
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select class</option>
                  {targetClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Section
                </label>
                <select
                  value={targetSectionId ?? ''}
                  onChange={(e) => setTargetSectionId(Number(e.target.value))}
                  disabled={!targetClassId}
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select section</option>
                  {targetSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetRollNumber}
                  onChange={(e) => setTargetRollNumber(e.target.value)}
                  placeholder="Leave blank to assign later"
                  className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPromotingEnrollment(null);
                    resetModal();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promoteMutation.isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {promoteMutation.isLoading ? 'Promoting...' : 'Promote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
