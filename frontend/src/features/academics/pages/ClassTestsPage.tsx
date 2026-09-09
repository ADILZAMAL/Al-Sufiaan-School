import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaTimes, FaChevronDown } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { examApi, chapterApi, subjectApi, marksApi } from '../api';
import { Exam, Chapter, Subject, StudentExamMark } from '../types';
import { generateMarksReportPdf } from '../lib/marksReportPdf';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { fetchClasses, ClassType } from '../../class/api';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';
import { getCurrentSchool } from '../../../api/school';

const emptyForm = { name: '', totalMarks: '', passingMarks: '', examDate: '', chapterIds: [] as number[] };

export default function ClassTestsPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Optional deep-link preselect (from the Subjects / Chapters pages)
  const wantSessionId = searchParams.get('sessionId');
  const wantClassIdRef = useRef(searchParams.get('classId'));
  const wantSubjectIdRef = useRef(searchParams.get('subjectId'));

  const [manualSessionId, setManualSessionId] = useState<number | null>(
    wantSessionId ? Number(wantSessionId) : null
  );
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [expandedExamId, setExpandedExamId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pdfExamId, setPdfExamId] = useState<number | null>(null);

  const { data: activeSession } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: sessions = [] } = useQuery<AcademicSession[]>('fetchSessions', academicSessionApi.getSessions, {
    staleTime: 5 * 60 * 1000,
  });

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;
  const sessionName = sessions.find(s => s.id === selectedSessionId)?.name ?? activeSession?.name ?? '';

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassType[]>(
    ['classes', selectedSessionId],
    () => fetchClasses(selectedSessionId as number),
    { enabled: selectedSessionId !== null }
  );

  const sections = activeClass?.sections || [];

  const { data: subjects = [] } = useQuery<Subject[]>(
    ['subjects', selectedSessionId, activeClass?.id],
    () => subjectApi.list(selectedSessionId as number, activeClass!.id),
    { enabled: selectedSessionId !== null && activeClass !== null }
  );

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>(
    ['exams', 'subject', subjectId],
    () => examApi.list(subjectId as number),
    { enabled: !!subjectId }
  );
  const classTests = exams
    .filter(e => e.examEventId == null)
    .sort((a, b) => (a.examDate ?? '').localeCompare(b.examDate ?? '') || a.name.localeCompare(b.name));

  const { data: chapters = [] } = useQuery<Chapter[]>(
    ['chapters', subjectId],
    () => chapterApi.list(subjectId as number),
    { enabled: !!subjectId }
  );

  const { data: school } = useQuery('currentSchool', getCurrentSchool, { staleTime: 10 * 60 * 1000 });

  const { data: expandedMarks = [], isLoading: expandedMarksLoading } = useQuery<StudentExamMark[]>(
    ['marks', expandedExamId, activeSectionId, selectedSessionId],
    () => marksApi.getByExam(expandedExamId as number, activeSectionId ?? undefined, selectedSessionId ?? undefined),
    {
      enabled: !!expandedExamId && !!activeSectionId && selectedSessionId !== null,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  // Auto-select class (honouring an optional ?classId preselect once)
  useEffect(() => {
    if (classes.length === 0) { setActiveClass(null); setActiveSectionId(null); return; }
    const want = wantClassIdRef.current;
    wantClassIdRef.current = null;
    setActiveClass(prev => {
      if (want) return classes.find(c => c.id === Number(want)) ?? classes[0];
      if (prev) return classes.find(c => c.id === prev.id) ?? classes[0];
      return classes[0];
    });
  }, [classes]);

  // Auto-select first section when class changes
  useEffect(() => {
    if (sections.length > 0) {
      setActiveSectionId(prev => (prev && sections.find(s => s.id === prev) ? prev : sections[0].id));
    } else {
      setActiveSectionId(null);
    }
    setExpandedExamId(null);
  }, [activeClass]);

  // Auto-select subject (honouring an optional ?subjectId preselect once)
  useEffect(() => {
    if (subjects.length === 0) { setSubjectId(''); return; }
    const want = wantSubjectIdRef.current;
    if (want && subjects.some(s => s.id === Number(want))) {
      wantSubjectIdRef.current = null;
      setSubjectId(Number(want));
      return;
    }
    setSubjectId(prev => (prev && subjects.some(s => s.id === prev) ? prev : subjects[0].id));
  }, [subjects]);

  useEffect(() => { setExpandedExamId(null); }, [subjectId, activeSectionId]);

  const handleSessionChange = (id: number) => {
    setManualSessionId(id);
    setActiveClass(null);
    setActiveSectionId(null);
    setSubjectId('');
  };

  const createMutation = useMutation(
    () => examApi.create({
      subjectId: subjectId as number,
      name: form.name,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      examDate: form.examDate || undefined,
      chapterIds: form.chapterIds,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', 'subject', subjectId]);
        setShowAddModal(false);
        setForm(emptyForm);
        showToast({ message: 'Class test created successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const updateMutation = useMutation(
    ({ id }: { id: number }) => examApi.update(id, {
      name: form.name,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      examDate: form.examDate || undefined,
      chapterIds: form.chapterIds,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', 'subject', subjectId]);
        setEditingExam(null);
        setForm(emptyForm);
        showToast({ message: 'Class test updated successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => examApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', 'subject', subjectId]);
        setDeletingExam(null);
        setExpandedExamId(null);
        showToast({ message: 'Class test deleted successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      totalMarks: String(exam.totalMarks),
      passingMarks: String(exam.passingMarks),
      examDate: exam.examDate || '',
      chapterIds: exam.examChapters?.map(ec => ec.chapter.id) ?? [],
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.passingMarks) > Number(form.totalMarks)) {
      showToast({ message: 'Passing marks cannot exceed total marks', type: 'ERROR' });
      return;
    }
    if (editingExam) updateMutation.mutate({ id: editingExam.id });
    else createMutation.mutate();
  };

  const toggleChapter = (id: number) => {
    setForm(f => ({
      ...f,
      chapterIds: f.chapterIds.includes(id) ? f.chapterIds.filter(c => c !== id) : [...f.chapterIds, id],
    }));
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const subjectName = subjects.find(s => s.id === subjectId)?.name ?? '';
  const sectionName = sections.find(s => s.id === activeSectionId)?.name ?? '';

  const handleDownload = async (exam: Exam) => {
    setPdfExamId(exam.id);
    try {
      await generateMarksReportPdf({
        school,
        sessionName,
        className: activeClass?.name ?? '',
        sectionName,
        subjectName,
        exam,
        marks: expandedMarks,
      });
    } catch (e) {
      showToast({ message: (e as Error).message, type: 'ERROR' });
    } finally {
      setPdfExamId(null);
    }
  };

  // Marks-view stats for the expanded test
  const presentMarks = expandedMarks.filter(m => !m.isAbsent && m.marksObtained !== null).map(m => Number(m.marksObtained));
  const expandedExam = classTests.find(t => t.id === expandedExamId);
  const avg = presentMarks.length ? (presentMarks.reduce((a, b) => a + b, 0) / presentMarks.length).toFixed(1) : '—';
  const highest = presentMarks.length ? Math.max(...presentMarks) : '—';
  const lowest = presentMarks.length ? Math.min(...presentMarks) : '—';
  const passCount = expandedExam ? presentMarks.filter(m => m >= expandedExam.passingMarks).length : 0;

  const closeModal = () => { setShowAddModal(false); setEditingExam(null); setForm(emptyForm); };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Tests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create class tests per subject and view their marks</p>
          </div>
          <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
        </div>

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
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first to add class tests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* Class list */}
            <div className="lg:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Classes</p>
              <div className="space-y-2">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setActiveClass(cls)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 text-sm font-semibold ${
                      activeClass?.id === cls.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-3">
              {activeClass && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                  {/* Section + subject bar */}
                  <div className="px-6 py-4 border-b border-gray-100 space-y-3">
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

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <select
                        value={subjectId}
                        onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : '')}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
                      >
                        <option value="">Select subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>

                      <button
                        onClick={() => { setShowAddModal(true); setForm(emptyForm); }}
                        disabled={!subjectId}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                      >
                        <FaPlus size={11} />
                        Add Class Test
                      </button>
                    </div>
                  </div>

                  {/* Class-test list */}
                  {!subjectId ? (
                    <div className="py-16 text-center text-sm text-gray-400">Select a subject to see its class tests</div>
                  ) : examsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : classTests.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-gray-500 text-sm font-medium">No class tests yet</p>
                      <p className="text-gray-400 text-xs mt-1">Add the first class test for {subjectName}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {classTests.map(exam => {
                        const passPct = Math.round((exam.passingMarks / exam.totalMarks) * 100);
                        const date = formatDate(exam.examDate);
                        const examChapters = exam.examChapters
                          ?.map(ec => ec.chapter)
                          .sort((a, b) => a.orderNumber - b.orderNumber) ?? [];
                        const isOpen = expandedExamId === exam.id;
                        return (
                          <li key={exam.id} className="px-6 py-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">{exam.name}</p>
                                {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
                                {examChapters.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {examChapters.map(ch => (
                                      <span key={ch.id} className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                                        <span className="text-gray-400 font-medium">{ch.orderNumber}.</span> {ch.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="hidden sm:flex items-center gap-4 shrink-0 text-center">
                                <div>
                                  <p className="text-xs text-gray-400">Total</p>
                                  <p className="text-sm font-bold text-gray-800">{exam.totalMarks}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Passing</p>
                                  <p className="text-sm font-bold text-gray-800">
                                    {exam.passingMarks}
                                    <span className="text-xs text-gray-400 font-normal ml-1">({passPct}%)</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEdit(exam)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit"
                                >
                                  <HiOutlinePencil className="text-base" />
                                </button>
                                <button
                                  onClick={() => setDeletingExam(exam)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <HiOutlineTrash className="text-base" />
                                </button>
                                <button
                                  onClick={() => setExpandedExamId(isOpen ? null : exam.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition ml-1"
                                >
                                  View marks
                                  <FaChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={10} />
                                </button>
                              </div>
                            </div>

                            {/* Inline marks view */}
                            {isOpen && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                {!activeSectionId ? (
                                  <p className="py-6 text-center text-sm text-gray-400">Select a section to view marks.</p>
                                ) : expandedMarksLoading ? (
                                  <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
                                  </div>
                                ) : expandedMarks.length === 0 ? (
                                  <p className="py-6 text-center text-sm text-gray-400">
                                    No students enrolled in this section for the selected session.
                                  </p>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex flex-wrap gap-4 text-sm">
                                        <span className="text-gray-500">Avg <span className="font-semibold text-gray-800">{avg}</span></span>
                                        <span className="text-gray-500">High <span className="font-semibold text-emerald-600">{highest}</span></span>
                                        <span className="text-gray-500">Low <span className="font-semibold text-red-500">{lowest}</span></span>
                                        <span className="text-gray-500">Passed <span className="font-semibold text-violet-600">{passCount}/{expandedMarks.length}</span></span>
                                      </div>
                                      <button
                                        onClick={() => handleDownload(exam)}
                                        disabled={pdfExamId === exam.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                      >
                                        {pdfExamId === exam.id
                                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          : <FiDownload size={12} />}
                                        {pdfExamId === exam.id ? 'Generating…' : 'Download PDF'}
                                      </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-100 text-sm">
                                        <thead>
                                          <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                                            <th className="px-4 py-2.5 text-left font-medium">Student</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Marks</th>
                                            <th className="px-4 py-2.5 text-left font-medium">%</th>
                                            <th className="px-4 py-2.5 text-left font-medium">Result</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {expandedMarks.map(mark => {
                                            const isAbsent = mark.isAbsent || mark.marksObtained === null;
                                            const passed = !isAbsent && mark.marksObtained !== null && mark.marksObtained >= exam.passingMarks;
                                            const p = isAbsent ? null : ((Number(mark.marksObtained) / exam.totalMarks) * 100).toFixed(1);
                                            return (
                                              <tr key={mark.studentId} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 font-medium text-gray-800">
                                                  {mark.student ? `${mark.student.firstName} ${mark.student.lastName}` : `Student #${mark.studentId}`}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-700">
                                                  {isAbsent ? '—' : `${mark.marksObtained} / ${exam.totalMarks}`}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-600">{p ? `${p}%` : '—'}</td>
                                                <td className="px-4 py-2.5">
                                                  {isAbsent ? (
                                                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">Absent</span>
                                                  ) : passed ? (
                                                    <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Pass</span>
                                                  ) : (
                                                    <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">Fail</span>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingExam) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExam ? 'Edit Class Test' : 'Add Class Test'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Test 1, Mid-Term, Quiz"
                  required
                  autoFocus
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalMarks}
                    onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.passingMarks}
                    onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Exam Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.examDate}
                  onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {chapters.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapters covered <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-44 overflow-y-auto">
                    {chapters.map(ch => (
                      <label key={ch.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.chapterIds.includes(ch.id)}
                          onChange={() => toggleChapter(ch.id)}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          <span className="text-gray-400 font-medium">{ch.orderNumber}.</span> {ch.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
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
                    : editingExam ? 'Save Changes' : 'Add Class Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingExam && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Class Test?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deleting <span className="font-medium text-gray-700">"{deletingExam.name}"</span> will also remove all student marks. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingExam(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingExam.id)}
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
