import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { FaClipboardList } from 'react-icons/fa';
import { marksApi } from '../api';
import { PendingExam } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { fetchClasses, ClassType } from '../../class/api';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';

const getStatusStyle = (status: string) => {
  if (status === 'Complete') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Not started') return 'bg-red-100 text-red-600';
  if (status.startsWith('Partial')) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
};

export default function PendingMarksPage() {
  const { showToast } = useAppContext();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);

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

  const { data: pending = [], isLoading } = useQuery<PendingExam[]>(
    ['pending-marks', activeClass?.id, activeSectionId, selectedSessionId],
    () => marksApi.getPending(activeClass!.id, activeSectionId as number, selectedSessionId as number),
    {
      enabled: !!activeClass && !!activeSectionId && selectedSessionId !== null,
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

  const handleSessionChange = (id: number) => {
    setManualSessionId(id);
    setActiveClass(null);
    setActiveSectionId(null);
  };

  const total = pending.length;
  const complete = pending.filter(p => p.status === 'Complete').length;
  const notStarted = pending.filter(p => p.status === 'Not started').length;
  const partial = total - complete - notStarted;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Marks</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monitor which exams still need mark entry by teachers</p>
          </div>
          <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
        </div>

        {/* Stats — shown when data is loaded */}
        {activeSectionId && !isLoading && pending.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Exams', value: total, colorBg: 'bg-blue-50', colorText: 'text-blue-600' },
              { label: 'Complete', value: complete, colorBg: 'bg-emerald-50', colorText: 'text-emerald-600' },
              { label: 'Partial', value: partial, colorBg: 'bg-amber-50', colorText: 'text-amber-600' },
              { label: 'Not Started', value: notStarted, colorBg: 'bg-red-50', colorText: 'text-red-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.colorBg} flex items-center justify-center shrink-0`}>
                  <FaClipboardList className={stat.colorText} size={14} />
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
                    {cls.sections && cls.sections.length > 0 && (
                      <span className={`text-xs ml-2 ${activeClass?.id === cls.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {cls.sections.length} section{cls.sections.length > 1 ? 's' : ''}
                      </span>
                    )}
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
                      <p className="text-gray-400 text-sm">Select a section to view pending marks</p>
                    </div>
                  ) : isLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : pending.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <FaClipboardList className="text-blue-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No exams found</p>
                      <p className="text-gray-400 text-xs mt-1">No exams have been created for this section yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chapter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {pending.map(item => (
                            <tr key={item.examId} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{item.subjectName}</td>
                              <td className="px-6 py-3.5 text-sm text-gray-600">{item.chapterName}</td>
                              <td className="px-6 py-3.5 text-sm text-gray-700">{item.examName}</td>
                              <td className="px-6 py-3.5 text-sm text-gray-600">
                                {item.teacher ? item.teacher.name : <span className="text-gray-400 italic">Unassigned</span>}
                              </td>
                              <td className="px-6 py-3.5 text-sm text-gray-600">
                                {item.marksEntered} / {item.totalStudents}
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaClipboardList className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first to track pending marks</p>
          </div>
        )}
      </div>
    </div>
  );
}
