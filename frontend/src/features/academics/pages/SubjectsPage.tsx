import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaBookOpen, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { subjectApi, chapterApi } from '../api';
import { Subject, Chapter } from '../types';
import { fetchClasses, ClassType } from '../../class/api';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';

// ── Expandable chapter list for a subject ────────────────────────────────────

function SubjectChapters({ subject, subjectName }: { subject: Subject; subjectName: string }) {
  const navigate = useNavigate();
  const { data: chapters = [], isLoading } = useQuery<Chapter[]>(
    ['chapters', subject.id],
    () => chapterApi.list(subject.id),
    { staleTime: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-6 py-4 text-sm text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        Loading chapters…
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <p className="px-6 py-4 text-sm text-gray-400 italic">
        No chapters yet. Go to{' '}
        <button
          onClick={() => navigate(`/dashboard/academics/chapters?subjectId=${subject.id}&subjectName=${encodeURIComponent(subjectName)}`)}
          className="text-blue-500 hover:underline"
        >
          Chapters page
        </button>{' '}
        to add some.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 bg-gray-50">
      {chapters.map(ch => (
        <li
          key={ch.id}
          className="flex items-center gap-3 px-8 py-2.5 hover:bg-blue-50 transition cursor-pointer group"
          onClick={() => navigate(`/dashboard/academics/exams?chapterId=${ch.id}&chapterName=${encodeURIComponent(ch.name)}&subjectName=${encodeURIComponent(subjectName)}`)}
        >
          <span className="w-6 text-xs text-gray-400 text-right shrink-0">{ch.orderNumber}.</span>
          <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-700 font-medium">{ch.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            ch.isTaught ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {ch.isTaught ? '✓ Taught' : 'Not taught'}
          </span>
          <FaChevronRight className="text-gray-300 group-hover:text-blue-400 text-xs shrink-0" />
        </li>
      ))}
      <li className="px-8 py-2.5">
        <button
          onClick={() => navigate(`/dashboard/academics/chapters?subjectId=${subject.id}&subjectName=${encodeURIComponent(subjectName)}`)}
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
        >
          Manage chapters →
        </button>
      </li>
    </ul>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState('');

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

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>(
    ['subjects', selectedSessionId, activeClass?.id],
    () => subjectApi.list(selectedSessionId as number, activeClass!.id),
    { enabled: selectedSessionId !== null && activeClass !== null }
  );

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
    setExpandedSubjectId(null);
  }, [classes]);

  const createMutation = useMutation(
    (name: string) => subjectApi.create({ sessionId: selectedSessionId as number, classId: activeClass!.id, name }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subjects', selectedSessionId, activeClass?.id]);
        setShowAddModal(false);
        setFormName('');
        showToast({ message: 'Subject created successfully', type: 'SUCCESS' });
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const updateMutation = useMutation(
    ({ id, name }: { id: number; name: string }) => subjectApi.update(id, name),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subjects', selectedSessionId, activeClass?.id]);
        setEditingSubject(null);
        setFormName('');
        showToast({ message: 'Subject updated successfully', type: 'SUCCESS' });
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => subjectApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subjects', selectedSessionId, activeClass?.id]);
        setDeletingSubject(null);
        showToast({ message: 'Subject deleted successfully', type: 'SUCCESS' });
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, name: formName });
    } else {
      createMutation.mutate(formName);
    }
  };

  const handleSessionChange = (sessionId: number) => {
    setManualSessionId(sessionId);
    setActiveClass(null);
    setExpandedSubjectId(null);
  };

  const toggleExpand = (subjectId: number) => {
    setExpandedSubjectId(prev => (prev === subjectId ? null : subjectId));
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage subjects per class and academic session</p>
          </div>
          <div className="flex items-center gap-3">
            <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
            <button
              onClick={() => { setShowAddModal(true); setFormName(''); }}
              disabled={selectedSessionId === null || activeClass === null}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <FaPlus size={11} />
              Add Subject
            </button>
          </div>
        </div>

        {/* Stats */}
        {selectedSessionId !== null && !classesLoading && classes.length > 0 && (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FaBookOpen className="text-blue-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Classes</p>
                <p className="text-xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <FaBookOpen className="text-emerald-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Subjects</p>
                <p className="text-xl font-bold text-gray-900">{subjects.length}</p>
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
                    onClick={() => { setActiveClass(cls); setExpandedSubjectId(null); }}
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      activeClass?.id === cls.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-semibold text-sm">{cls.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subjects Panel */}
            <div className="lg:col-span-2">
              {activeClass && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{activeClass.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {subjectsLoading ? '…' : `${subjects.length} ${subjects.length === 1 ? 'subject' : 'subjects'}`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowAddModal(true); setFormName(''); }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      <FaPlus size={11} />
                      Add Subject
                    </button>
                  </div>

                  {subjectsLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : subjects.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {subjects.map(subject => {
                        const isOpen = expandedSubjectId === subject.id;
                        return (
                          <li key={subject.id}>
                            {/* Subject row */}
                            <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 group transition">
                              {/* Expand toggle */}
                              <button
                                onClick={() => toggleExpand(subject.id)}
                                className="flex items-center gap-2 flex-1 text-left min-w-0"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <FaBookOpen className="text-blue-500" size={12} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800 flex-1">{subject.name}</span>
                                <FaChevronDown
                                  className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                />
                              </button>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                <button
                                  onClick={() => { setEditingSubject(subject); setFormName(subject.name); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit"
                                >
                                  <HiOutlinePencil className="text-base" />
                                </button>
                                <button
                                  onClick={() => setDeletingSubject(subject)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <HiOutlineTrash className="text-base" />
                                </button>
                              </div>
                            </div>

                            {/* Chapters — expanded */}
                            {isOpen && (
                              <SubjectChapters subject={subject} subjectName={subject.name} />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <FaBookOpen className="text-blue-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No subjects yet</p>
                      <p className="text-gray-400 text-xs mt-1">Add subjects for {activeClass.name}</p>
                      <button
                        onClick={() => { setShowAddModal(true); setFormName(''); }}
                        className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      >
                        <FaPlus size={11} />
                        Add First Subject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaBookOpen className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first before adding subjects</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingSubject) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSubject ? 'Edit Subject' : `Add Subject to ${activeClass?.name}`}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingSubject(null); setFormName(''); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Mathematics, Science"
                  required
                  autoFocus
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingSubject(null); setFormName(''); }}
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
                    : editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingSubject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Subject?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deleting <span className="font-medium text-gray-700">"{deletingSubject.name}"</span> will also remove all its chapters and exams. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingSubject(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingSubject.id)}
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
