import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { FaListAlt } from 'react-icons/fa';
import { subjectApi, chapterApi, examApi, marksApi } from '../api';
import { StudentExamMark } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { fetchClasses, ClassType } from '../../class/api';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';

export default function MarksViewerPage() {
  const { showToast } = useAppContext();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [chapterId, setChapterId] = useState<number | ''>('');
  const [examId, setExamId] = useState<number | ''>('');

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

  const { data: subjects = [] } = useQuery(
    ['subjects', selectedSessionId, activeClass?.id],
    () => subjectApi.list(selectedSessionId as number, activeClass!.id),
    { enabled: selectedSessionId !== null && activeClass !== null }
  );

  const { data: chapters = [] } = useQuery(
    ['chapters', subjectId],
    () => chapterApi.list(subjectId as number),
    { enabled: !!subjectId }
  );

  const { data: exams = [] } = useQuery(
    ['exams', chapterId],
    () => examApi.list(chapterId as number),
    { enabled: !!chapterId }
  );

  const { data: marks = [], isLoading: marksLoading } = useQuery<StudentExamMark[]>(
    ['marks', examId],
    () => marksApi.getByExam(examId as number),
    {
      enabled: !!examId,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  // Auto-select first class
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
    setSubjectId('');
    setChapterId('');
    setExamId('');
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
    setSubjectId('');
    setChapterId('');
    setExamId('');
  }, [activeClass]);

  const handleSessionChange = (id: number) => {
    setManualSessionId(id);
    setActiveClass(null);
    setActiveSectionId(null);
    setSubjectId('');
    setChapterId('');
    setExamId('');
  };

  const selectedExam = exams.find(e => e.id === examId);
  const presentMarks = marks.filter(m => !m.isAbsent && m.marksObtained !== null).map(m => Number(m.marksObtained));
  const avg = presentMarks.length ? (presentMarks.reduce((a, b) => a + b, 0) / presentMarks.length).toFixed(1) : '—';
  const highest = presentMarks.length ? Math.max(...presentMarks) : '—';
  const lowest = presentMarks.length ? Math.min(...presentMarks) : '—';
  const passCount = presentMarks.filter(m => selectedExam && m >= selectedExam.passingMarks).length;

  const pct = (m: number | null) => {
    if (m === null || !selectedExam) return '—';
    return `${((m / selectedExam.totalMarks) * 100).toFixed(1)}%`;
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marks Viewer</h1>
            <p className="text-sm text-gray-500 mt-0.5">Drill down to view student marks for any exam</p>
          </div>
          <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
        </div>

        {/* Summary stats — shown only when exam is selected */}
        {selectedExam && marks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Class Average', value: avg, sub: `out of ${selectedExam.totalMarks}`, colorBg: 'bg-blue-50', colorText: 'text-blue-600' },
              { label: 'Highest', value: highest, sub: `out of ${selectedExam.totalMarks}`, colorBg: 'bg-emerald-50', colorText: 'text-emerald-600' },
              { label: 'Lowest', value: lowest, sub: `out of ${selectedExam.totalMarks}`, colorBg: 'bg-red-50', colorText: 'text-red-500' },
              { label: 'Pass / Total', value: `${passCount} / ${marks.length}`, sub: `passing ≥ ${selectedExam.passingMarks}`, colorBg: 'bg-violet-50', colorText: 'text-violet-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.colorBg} flex items-center justify-center shrink-0`}>
                  <FaListAlt className={stat.colorText} size={14} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.colorText}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
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

            {/* Class list */}
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
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2">
              {activeClass && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                  {/* Section tabs */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">{activeClass.name}</h3>
                    {sections.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sections.map(sec => (
                          <button
                            key={sec.id}
                            onClick={() => {
                              setActiveSectionId(sec.id);
                              setSubjectId('');
                              setChapterId('');
                              setExamId('');
                            }}
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

                  {/* Filter bar: Subject → Chapter → Exam */}
                  {activeSectionId && (
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 bg-gray-50">
                      <select
                        value={subjectId}
                        onChange={e => {
                          setSubjectId(e.target.value ? Number(e.target.value) : '');
                          setChapterId('');
                          setExamId('');
                        }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[130px]"
                      >
                        <option value="">Subject</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>

                      <select
                        value={chapterId}
                        onChange={e => {
                          setChapterId(e.target.value ? Number(e.target.value) : '');
                          setExamId('');
                        }}
                        disabled={!subjectId}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-40 min-w-[130px]"
                      >
                        <option value="">Chapter</option>
                        {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>

                      <select
                        value={examId}
                        onChange={e => setExamId(e.target.value ? Number(e.target.value) : '')}
                        disabled={!chapterId}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-40 min-w-[130px]"
                      >
                        <option value="">Exam</option>
                        {exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Marks content */}
                  {!activeSectionId ? (
                    <div className="py-16 text-center">
                      <p className="text-gray-400 text-sm">Select a section to continue</p>
                    </div>
                  ) : !examId ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <FaListAlt className="text-blue-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Select subject → chapter → exam</p>
                      <p className="text-gray-400 text-xs mt-1">Use the filters above to drill down</p>
                    </div>
                  ) : marksLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : marks.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <FaListAlt className="text-gray-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No marks entered yet</p>
                      <p className="text-gray-400 text-xs mt-1">Marks for this exam haven't been entered yet</p>
                    </div>
                  ) : (
                    <>
                      {/* Exam info bar */}
                      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{selectedExam?.name}</p>
                        <p className="text-xs text-gray-400">
                          Total: <span className="font-medium text-gray-600">{selectedExam?.totalMarks}</span>
                          &nbsp;&nbsp;Pass: <span className="font-medium text-gray-600">{selectedExam?.passingMarks}</span>
                        </p>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Marks</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {marks.map((mark, i) => {
                              const isPassed = !mark.isAbsent && mark.marksObtained !== null && selectedExam && mark.marksObtained >= selectedExam.passingMarks;
                              return (
                                <tr key={mark.id} className="hover:bg-gray-50 transition">
                                  <td className="px-6 py-3.5 text-sm text-gray-400">{i + 1}</td>
                                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">
                                    {mark.student ? `${mark.student.firstName} ${mark.student.lastName}` : `Student #${mark.studentId}`}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-gray-700">
                                    {mark.isAbsent ? '—' : `${mark.marksObtained} / ${selectedExam?.totalMarks}`}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-gray-600">
                                    {mark.isAbsent ? '—' : pct(mark.marksObtained)}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    {mark.isAbsent ? (
                                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">Absent</span>
                                    ) : isPassed ? (
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
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaListAlt className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first to view marks</p>
          </div>
        )}
      </div>
    </div>
  );
}
