import { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { marksApi } from '../api';
import { SubjectWithExams } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { getStudentById } from '../../students/api';
import { useAppContext } from '../../../providers/AppContext';

interface ExamRow {
  examName: string;
  marksObtained: number | null;
  totalMarks: number;
  passingMarks: number;
  isAbsent: boolean;
}

interface SubjectSummary {
  subjectName: string;
  exams: ExamRow[];
  avgPct: number | null;
}

function buildSummaries(subjects: SubjectWithExams[]): SubjectSummary[] {
  return subjects.map(subject => {
    const exams: ExamRow[] = [];
    for (const exam of subject.exams || []) {
      const mark = exam.marks?.[0];
      if (mark !== undefined) {
        exams.push({
          examName: exam.name,
          marksObtained: mark.marksObtained,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          isAbsent: mark.isAbsent,
        });
      }
    }
    const scored = exams.filter(e => !e.isAbsent && e.marksObtained !== null);
    const avgPct = scored.length
      ? scored.reduce((sum, e) => sum + (e.marksObtained! / e.totalMarks) * 100, 0) / scored.length
      : null;
    return { subjectName: subject.name, exams, avgPct };
  });
}

const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function StudentReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useAppContext();

  const [sessionId, setSessionId] = useState<number | ''>('');

  const { data: student } = useQuery(
    ['student', id],
    () => getStudentById(Number(id)),
    { enabled: !!id }
  );
  const { data: sessions = [] } = useQuery('sessions', academicSessionApi.getSessions);
  const { data: subjects = [], isLoading } = useQuery<SubjectWithExams[]>(
    ['student-marks', id, sessionId],
    () => marksApi.getByStudent(Number(id), sessionId as number),
    {
      enabled: !!id && !!sessionId,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const summaries = buildSummaries(subjects as SubjectWithExams[]);
  const chartData = summaries
    .filter(s => s.avgPct !== null)
    .map(s => ({ subject: s.subjectName, avg: parseFloat(s.avgPct!.toFixed(1)) }));

  const studentName = student ? `${student.firstName} ${student.lastName}` : `Student #${id}`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <HiOutlineArrowLeft className="text-lg" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{studentName}</h1>
          <p className="text-sm text-gray-500">Academic Performance Report</p>
        </div>
      </div>

      {/* Session selector */}
      <div className="flex items-center gap-3 mb-8">
        <select
          value={sessionId}
          onChange={e => setSessionId(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select Session</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!sessionId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          Select a session to view the academic report.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No academic data found for this student in the selected session.
        </div>
      ) : (
        <>
          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Subject-wise Average %</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="subject"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Avg Score']} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-subject cards */}
          <div className="space-y-4">
            {summaries.map(summary => (
              <div key={summary.subjectName} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{summary.subjectName}</h3>
                  {summary.avgPct !== null ? (
                    <span className={`text-sm font-semibold ${summary.avgPct >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      Avg: {summary.avgPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No marks entered</span>
                  )}
                </div>
                {summary.exams.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-gray-400 italic">No exams in this subject.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-white">
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Exam</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Marks</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">%</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.exams.map((exam, i) => {
                        const pct = exam.isAbsent || exam.marksObtained === null
                          ? null
                          : ((exam.marksObtained / exam.totalMarks) * 100).toFixed(1);
                        const passed = !exam.isAbsent && exam.marksObtained !== null && exam.marksObtained >= exam.passingMarks;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-2.5 text-sm font-medium text-gray-800">{exam.examName}</td>
                            <td className="px-6 py-2.5 text-sm text-gray-700">
                              {exam.isAbsent ? '—' : `${exam.marksObtained} / ${exam.totalMarks}`}
                            </td>
                            <td className="px-6 py-2.5 text-sm text-gray-600">{pct ? `${pct}%` : '—'}</td>
                            <td className="px-6 py-2.5">
                              {exam.isAbsent ? (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Absent</span>
                              ) : passed ? (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Pass</span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Fail</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
