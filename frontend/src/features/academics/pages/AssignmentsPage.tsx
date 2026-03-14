import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FaUserTie, FaTimes } from 'react-icons/fa';
import { HiOutlineTrash } from 'react-icons/hi';
import { assignmentApi, subjectApi } from '../api';
import { TeacherSubjectAssignment, Subject } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { fetchClasses, ClassType } from '../../class/api';
import { staffApi } from '../../staff/api/staff';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';

export default function AssignmentsPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);

  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');

  const { data: activeSession } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassType[]>(
    ['classes', selectedSessionId],
    () => fetchClasses(selectedSessionId as number),
    { enabled: selectedSessionId !== null }
  );

  const sections = activeClass?.sections || [];

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>(
    ['subjects', selectedSessionId, activeClass?.id],
    () => subjectApi.list(selectedSessionId as number, activeClass!.id),
    { enabled: selectedSessionId !== null && activeClass !== null }
  );

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<TeacherSubjectAssignment[]>(
    ['assignments', selectedSessionId, activeSectionId],
    () => assignmentApi.list({ sessionId: selectedSessionId as number, sectionId: activeSectionId as number }),
    { enabled: selectedSessionId !== null && activeSectionId !== null }
  );

  const { data: teachingStaff = [] } = useQuery(
    'teachingStaff',
    () => staffApi.getAll(true, 'teaching'),
    { staleTime: 5 * 60 * 1000 }
  );

  // Auto-select first class when classes load
  useEffect(() => {
    if (classes.length > 0) {
      setActiveClass(prev => {
        if (prev) {
          const updated = classes.find(c => c.id === prev.id);
          return updated ?? classes[0];
        }
        return classes[0];
      });
    } else {
      setActiveClass(null);
    }
    setActiveSectionId(null);
  }, [classes]);

  // Auto-select first section when class changes
  useEffect(() => {
    if (sections.length > 0) {
      setActiveSectionId(prev => {
        if (prev && sections.find(s => s.id === prev)) return prev;
        return sections[0].id;
      });
    } else {
      setActiveSectionId(null);
    }
  }, [activeClass]);

  const createMutation = useMutation(
    () => assignmentApi.create({
      subjectId: assigningSubject!.id,
      staffId: selectedStaffId as number,
      sectionId: activeSectionId as number,
      sessionId: selectedSessionId as number,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignments', selectedSessionId, activeSectionId]);
        setAssigningSubject(null);
        setSelectedStaffId('');
        showToast({ message: 'Teacher assigned successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => assignmentApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignments', selectedSessionId, activeSectionId]);
        showToast({ message: 'Assignment removed', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const handleSessionChange = (sessionId: number) => {
    setManualSessionId(sessionId);
    setActiveClass(null);
    setActiveSectionId(null);
  };

  // Map subjectId → assignment for quick lookup
  const assignmentBySubjectId = new Map<number, TeacherSubjectAssignment>(
    assignments.map(a => [a.subjectId, a])
  );

  const assignedCount = subjects.filter(s => assignmentBySubjectId.has(s.id)).length;
  const isContentLoading = subjectsLoading || assignmentsLoading;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
            <p className="text-sm text-gray-500 mt-0.5">Assign teachers to subjects per section and session</p>
          </div>
          <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
        </div>

        {/* Stats */}
        {selectedSessionId !== null && !classesLoading && classes.length > 0 && activeSectionId !== null && (
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FaUserTie className="text-blue-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-xl font-bold text-gray-900">{subjects.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <FaUserTie className="text-emerald-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Assigned</p>
                <p className="text-xl font-bold text-gray-900">{assignedCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <FaUserTie className="text-amber-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-xl font-bold text-gray-900">{subjects.length - assignedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {selectedSessionId === null ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <p className="text-amber-700 font-medium text-sm">
              No active session found. Please create and activate a session first.
            </p>
          </div>
        ) : classesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Class List */}
            <div className="lg:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Classes ({classes.length})
              </p>
              <div className="space-y-2">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setActiveClass(cls)}
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      activeClass?.id === cls.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-semibold text-sm">{cls.name}</span>
                    {cls.sections && cls.sections.length > 0 && (
                      <span className={`text-xs ml-2 ${activeClass?.id === cls.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {cls.sections.length} section{cls.sections.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignments Panel */}
            <div className="lg:col-span-2">
              {activeClass ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                  {/* Panel Header: class name + section tabs */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">{activeClass.name}</h3>
                    {sections.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sections.map(sec => (
                          <button
                            key={sec.id}
                            onClick={() => setActiveSectionId(sec.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                              activeSectionId === sec.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            {sec.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No sections in this class</p>
                    )}
                  </div>

                  {/* Content */}
                  {!activeSectionId ? (
                    <div className="py-16 text-center">
                      <p className="text-gray-400 text-sm">Select a section to manage assignments</p>
                    </div>
                  ) : isContentLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <FaUserTie className="text-blue-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No subjects yet</p>
                      <p className="text-gray-400 text-xs mt-1">Add subjects for {activeClass.name} first</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {subjects.map(subject => {
                        const assignment = assignmentBySubjectId.get(subject.id);
                        return (
                          <li key={subject.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 group transition">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <FaUserTie className="text-blue-500" size={12} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">{subject.name}</p>
                              {assignment ? (
                                <p className="text-xs text-emerald-600 font-medium mt-0.5">{assignment.teacher?.name}</p>
                              ) : (
                                <p className="text-xs text-gray-400 italic mt-0.5">Unassigned</p>
                              )}
                            </div>

                            <div className="shrink-0">
                              {assignment ? (
                                <button
                                  onClick={() => deleteMutation.mutate(assignment.id)}
                                  disabled={deleteMutation.isLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                  <HiOutlineTrash className="text-sm" />
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setAssigningSubject(subject); setSelectedStaffId(''); }}
                                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  Assign Teacher
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaUserTie className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first before managing assignments</p>
          </div>
        )}
      </div>

      {/* Assign Teacher Modal */}
      {assigningSubject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Assign Teacher</h3>
              <button
                onClick={() => { setAssigningSubject(null); setSelectedStaffId(''); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Subject: <span className="font-medium text-gray-700">{assigningSubject.name}</span>
            </p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Teacher</label>
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Choose a teacher…</option>
                {teachingStaff.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAssigningSubject(null); setSelectedStaffId(''); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!selectedStaffId || createMutation.isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {createMutation.isLoading ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
