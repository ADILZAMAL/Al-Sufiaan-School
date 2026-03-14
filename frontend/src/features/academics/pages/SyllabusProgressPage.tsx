import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FaBookOpen } from 'react-icons/fa';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { syllabusApi, chapterApi } from '../api';
import { SyllabusSubject } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { fetchClasses, ClassType } from '../../class/api';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';

export default function SyllabusProgressPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);

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

  const { data: subjects = [], isLoading } = useQuery<SyllabusSubject[]>(
    ['syllabus-progress', activeClass?.id, selectedSessionId],
    () => syllabusApi.getProgress(activeClass!.id, selectedSessionId as number),
    {
      enabled: !!activeClass && selectedSessionId !== null,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const toggleTaught = useMutation(
    ({ chapterId, isTaught }: { chapterId: number; isTaught: boolean }) =>
      chapterApi.update(chapterId, {
        isTaught,
        taughtOn: isTaught ? new Date().toISOString().split('T')[0] : undefined,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['syllabus-progress', activeClass?.id, selectedSessionId]);
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
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
  }, [classes]);

  const handleSessionChange = (id: number) => {
    setManualSessionId(id);
    setActiveClass(null);
  };

  const totalChapters = subjects.reduce((s, sub) => s + sub.totalChapters, 0);
  const taughtChapters = subjects.reduce((s, sub) => s + sub.taughtChapters, 0);
  const overallPct = totalChapters > 0 ? Math.round((taughtChapters / totalChapters) * 100) : 0;

  const progressColor = (pct: number) =>
    pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';
  const progressTextColor = (pct: number) =>
    pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-blue-600' : 'text-amber-600';

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Syllabus Progress</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track chapter-wise teaching progress for each subject</p>
          </div>
          <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
        </div>

        {/* Stats — shown when data is loaded */}
        {activeClass && !isLoading && subjects.length > 0 && (
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {[
              { label: 'Total Chapters', value: totalChapters, colorBg: 'bg-blue-50', colorText: 'text-blue-600' },
              { label: 'Taught', value: taughtChapters, colorBg: 'bg-emerald-50', colorText: 'text-emerald-600' },
              { label: 'Remaining', value: totalChapters - taughtChapters, colorBg: 'bg-amber-50', colorText: 'text-amber-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.colorBg} flex items-center justify-center shrink-0`}>
                  <FaBookOpen className={stat.colorText} size={14} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.colorText}`}>{stat.value}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

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
            <div className="lg:col-span-2 space-y-4">
              {!activeClass ? null : isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : subjects.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <FaBookOpen className="text-blue-300" size={18} />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No subjects yet</p>
                  <p className="text-gray-400 text-xs mt-1">Add subjects for {activeClass.name} first</p>
                </div>
              ) : (
                <>
                  {/* Overall progress bar */}
                  <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                      <span className={`text-sm font-bold ${progressTextColor(overallPct)}`}>
                        {taughtChapters} / {totalChapters} chapters &nbsp;({overallPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${progressColor(overallPct)}`}
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Subject cards */}
                  {subjects.map(subject => (
                    <div key={subject.subjectId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Subject header */}
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <FaBookOpen className="text-blue-500" size={11} />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">{subject.subjectName}</h3>
                          </div>
                          <span className={`text-xs font-semibold ${progressTextColor(subject.progressPct)}`}>
                            {subject.taughtChapters}/{subject.totalChapters} &nbsp;({subject.progressPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${progressColor(subject.progressPct)}`}
                            style={{ width: `${subject.progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Chapters list */}
                      {subject.chapters.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-gray-400 italic">No chapters added yet.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {subject.chapters.map(chapter => (
                            <li key={chapter.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition group">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs text-gray-400 w-5 text-right shrink-0">{chapter.orderNumber}.</span>
                                <span className={`text-sm truncate ${chapter.isTaught ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                  {chapter.name}
                                </span>
                                {chapter.isTaught && chapter.taughtOn && (
                                  <span className="text-xs text-gray-400 shrink-0">
                                    {new Date(chapter.taughtOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => toggleTaught.mutate({ chapterId: chapter.id, isTaught: !chapter.isTaught })}
                                disabled={toggleTaught.isLoading}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors disabled:opacity-50 shrink-0 ml-4 font-medium ${
                                  chapter.isTaught
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                                }`}
                              >
                                {chapter.isTaught ? (
                                  <><HiOutlineCheckCircle className="text-base" /> Taught</>
                                ) : (
                                  <><HiOutlineXCircle className="text-base" /> Not Taught</>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaBookOpen className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first to track syllabus progress</p>
          </div>
        )}
      </div>
    </div>
  );
}
