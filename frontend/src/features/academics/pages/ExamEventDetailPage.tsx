import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaTimes, FaChevronDown } from 'react-icons/fa';
import { HiOutlinePencil } from 'react-icons/hi';
import { examApi, marksApi, subjectApi } from '../api';
import { Exam, Subject, StudentExamMark } from '../types';
import { fetchClasses, ClassType, SectionType } from '../../class/api/index';
import { useAppContext } from '../../../providers/AppContext';

// ── Marks entry panel for a subject exam ────────────────────────────────────

function MarksEntryPanel({
  exam,
  sectionId,
  sessionId,
  onClose,
}: {
  exam: Exam;
  sectionId: number;
  sessionId: number;
  onClose: () => void;
}) {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const { data: existingMarks = [], isLoading } = useQuery<StudentExamMark[]>(
    ['marks', exam.id, sectionId, sessionId],
    () => marksApi.getByExam(exam.id, sectionId, sessionId)
  );

  const [markValues, setMarkValues] = useState<Record<number, { obtained: string; absent: boolean }>>({});

  // Initialise inputs from existing marks
  useEffect(() => {
    const initial: Record<number, { obtained: string; absent: boolean }> = {};
    existingMarks.forEach(m => {
      initial[m.studentId] = {
        obtained: m.isAbsent ? '' : String(m.marksObtained ?? ''),
        absent: m.isAbsent,
      };
    });
    setMarkValues(initial);
  }, [existingMarks]);

  const submitMutation = useMutation(
    () => {
      const marks = existingMarks.map(m => ({
        studentId: m.studentId,
        isAbsent: markValues[m.studentId]?.absent ?? false,
        marksObtained: markValues[m.studentId]?.absent
          ? undefined
          : markValues[m.studentId]?.obtained !== ''
            ? Number(markValues[m.studentId]?.obtained)
            : undefined,
      }));
      return marksApi.bulkSubmit(exam.id, marks);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['marks', exam.id]);
        showToast({ message: 'Marks saved successfully', type: 'SUCCESS' });
        onClose();
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (existingMarks.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No students enrolled in this section for the selected session.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">Student</th>
              <th className="text-center px-4 py-2.5 font-medium w-20">Absent</th>
              <th className="text-center px-4 py-2.5 font-medium w-32">
                Marks <span className="normal-case font-normal text-gray-400">/ {exam.totalMarks}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {existingMarks.map(m => {
              const val = markValues[m.studentId] ?? { obtained: '', absent: false };
              return (
                <tr key={m.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">
                      {m.student?.firstName} {m.student?.lastName}
                    </p>
                    {m.student?.enrollments?.[0]?.rollNumber && (
                      <p className="text-xs text-gray-400">Roll: {m.student.enrollments[0].rollNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={val.absent}
                      onChange={e => setMarkValues(prev => ({
                        ...prev,
                        [m.studentId]: { ...val, absent: e.target.checked, obtained: '' },
                      }))}
                      className="w-4 h-4 rounded accent-red-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="number"
                      min="0"
                      max={exam.totalMarks}
                      value={val.obtained}
                      disabled={val.absent}
                      onChange={e => setMarkValues(prev => ({
                        ...prev,
                        [m.studentId]: { ...val, obtained: e.target.value },
                      }))}
                      className="w-20 border border-gray-300 px-2 py-1.5 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isLoading}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitMutation.isLoading ? 'Saving...' : 'Save Marks'}
        </button>
      </div>
    </div>
  );
}

// ── Subject row with configure + marks entry ─────────────────────────────────

function SubjectExamRow({
  subject,
  examEventId,
  eventName,
  sessionId,
  sectionId,
}: {
  subject: Subject;
  examEventId: number;
  eventName: string;
  sessionId: number;
  sectionId: number | null;
}) {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMarksPanel, setShowMarksPanel] = useState(false);
  const [form, setForm] = useState({ totalMarks: '', passingMarks: '', examDate: '' });

  const { data: exams = [] } = useQuery<Exam[]>(
    ['exams', 'event-subject', examEventId, subject.id],
    () => examApi.list(subject.id, examEventId)
  );

  const exam = exams[0] ?? null;

  const createMutation = useMutation(
    () => examApi.create({
      subjectId: subject.id,
      examEventId,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      examDate: form.examDate || undefined,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', 'event-subject', examEventId, subject.id]);
        queryClient.invalidateQueries(['exam-events']);
        setShowConfigModal(false);
        showToast({ message: `${subject.name} exam configured`, type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const updateMutation = useMutation(
    () => examApi.update(exam!.id, {
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      examDate: form.examDate || undefined,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', 'event-subject', examEventId, subject.id]);
        setShowConfigModal(false);
        showToast({ message: `${subject.name} exam updated`, type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const openConfig = () => {
    if (exam) {
      setForm({
        totalMarks: String(exam.totalMarks),
        passingMarks: String(exam.passingMarks),
        examDate: exam.examDate ?? '',
      });
    } else {
      setForm({ totalMarks: '', passingMarks: '', examDate: '' });
    }
    setShowConfigModal(true);
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.passingMarks) > Number(form.totalMarks)) {
      showToast({ message: 'Passing marks cannot exceed total marks', type: 'ERROR' });
      return;
    }
    if (exam) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;

  return (
    <>
      <li className="px-6 py-3.5 hover:bg-gray-50 transition">
        <div className="flex items-center gap-4">
          {/* Subject name */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{subject.name}</p>
            {exam && (
              <p className="text-xs text-gray-400 mt-0.5">
                {exam.totalMarks} marks · Pass: {exam.passingMarks}
                {exam.examDate && ` · ${formatDate(exam.examDate)}`}
              </p>
            )}
          </div>

          {/* Status */}
          {exam ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0 hidden sm:inline">
              Configured
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0 hidden sm:inline">
              Not set up
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <HiOutlinePencil size={12} />
              {exam ? 'Edit' : 'Configure'}
            </button>
            {exam && sectionId && (
              <button
                onClick={() => setShowMarksPanel(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
              >
                Enter Marks
                <FaChevronDown className={`transition-transform duration-200 ${showMarksPanel ? 'rotate-180' : ''}`} size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Marks Entry Panel (inline expand) */}
        {showMarksPanel && exam && sectionId && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <MarksEntryPanel
              exam={exam}
              sectionId={sectionId}
              sessionId={sessionId}
              onClose={() => setShowMarksPanel(false)}
            />
          </div>
        )}
      </li>

      {/* Configure Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {exam ? 'Edit Exam' : 'Configure Exam'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {eventName} — {subject.name}
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalMarks}
                    onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))}
                    required
                    autoFocus
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
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ExamEventDetailPage() {
  const { examEventId } = useParams<{ examEventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = Number(searchParams.get('sessionId'));
  const eventName = searchParams.get('eventName') || 'Exam Event';

  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassType[]>(
    ['classes', sessionId],
    () => fetchClasses(sessionId),
    { enabled: !!sessionId }
  );

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>(
    ['subjects', sessionId, activeClass?.id],
    () => subjectApi.list(sessionId, activeClass!.id),
    { enabled: !!sessionId && !!activeClass }
  );

  // Auto-select first class
  useEffect(() => {
    if (classes.length > 0) {
      setActiveClass(prev => {
        if (prev) return classes.find(c => c.id === prev.id) ?? classes[0];
        return classes[0];
      });
    } else {
      setActiveClass(null);
    }
    setActiveSectionId(null);
  }, [classes]);

  // Auto-select first section
  useEffect(() => {
    const sections = activeClass?.sections || [];
    if (sections.length > 0) {
      setActiveSectionId(prev => {
        if (prev && sections.find(s => s.id === prev)) return prev;
        return sections[0].id;
      });
    } else {
      setActiveSectionId(null);
    }
  }, [activeClass]);

  const sections: SectionType[] = activeClass?.sections || [];

  if (!examEventId || !sessionId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Invalid page parameters.{' '}
        <button onClick={() => navigate('/dashboard/academics/exam-events')} className="text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <button
                onClick={() => navigate('/dashboard/academics/exam-events')}
                className="hover:text-blue-600 transition font-medium"
              >
                Exam Events
              </button>
              <FaChevronRight className="text-gray-300" size={9} />
              <span className="text-gray-600 font-medium">{eventName}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{eventName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure marks per subject and enter student marks</p>
          </div>
        </div>

        {classesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <p className="text-gray-500 text-sm">No classes found for this session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* Class list */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Classes
                </p>
                <div className="space-y-2">
                  {classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setActiveClass(cls)}
                      type="button"
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

              {/* Section selector */}
              {sections.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Section (for marks entry)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sections.map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSectionId(sec.id)}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                          activeSectionId === sec.id
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {sec.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subjects panel */}
            <div className="lg:col-span-3">
              {activeClass && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">{activeClass.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {subjectsLoading ? '…' : `${subjects.length} subject${subjects.length === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  {subjectsLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                      No subjects found for this class.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {subjects.map(subject => (
                        <SubjectExamRow
                          key={subject.id}
                          subject={subject}
                          examEventId={Number(examEventId)}
                          eventName={eventName}
                          sessionId={sessionId}
                          sectionId={activeSectionId}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
