import { useQuery } from 'react-query';
import { HiPhone } from 'react-icons/hi';
import { attendanceApi, StudentWithAttendance } from '../api';

type Props = {
  classId: number;
  sectionId: number;
  date: string;
  colSpan: number;
};

const studentName = (s: StudentWithAttendance) => `${s.firstName} ${s.lastName}`;

const parentPhone = (s: StudentWithAttendance) => s.fatherPhone || s.motherPhone || s.guardianPhone || null;

export default function ClassAttendanceDetailPanel({ classId, sectionId, date, colSpan }: Props) {
  const { data: students = [], isLoading, isError, error } = useQuery<StudentWithAttendance[], Error>(
    ['studentsWithAttendance', classId, sectionId, date],
    () => attendanceApi.getStudentsWithAttendance(classId, sectionId, date),
    { enabled: !!date }
  );

  const present = students.filter((s) => s.attendance?.status === 'PRESENT');
  const absent = students.filter((s) => s.attendance?.status === 'ABSENT');

  return (
    <td colSpan={colSpan} className="px-0 py-0 bg-gray-50/60 border-t border-gray-100">
      <div className="px-10 py-4">
        {isLoading ? (
          <div className="text-sm text-gray-400">Loading students…</div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            Failed to load students: {error?.message}
          </div>
        ) : students.length === 0 ? (
          <div className="text-sm text-gray-400">No students enrolled in this class/section.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                Present ({present.length})
              </p>
              {present.length === 0 ? (
                <p className="text-xs text-gray-400">None</p>
              ) : (
                <ul className="space-y-1.5">
                  {present.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold shrink-0">
                        {s.rollNumber}
                      </span>
                      <span className="text-gray-800">{studentName(s)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                Absent ({absent.length})
              </p>
              {absent.length === 0 ? (
                <p className="text-xs text-gray-400">None</p>
              ) : (
                <ul className="space-y-1.5">
                  {absent.map((s) => {
                    const phone = parentPhone(s);
                    return (
                      <li key={s.id} className="text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-800 text-xs font-semibold shrink-0">
                            {s.rollNumber}
                          </span>
                          <span className="text-gray-800">{studentName(s)}</span>
                          {typeof s.daysAbsentSinceLastPresent === 'number' && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium">
                              {s.daysAbsentSinceLastPresent} day(s)
                            </span>
                          )}
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <HiPhone className="text-sm" />
                              {phone}
                            </a>
                          )}
                        </div>
                        {s.attendance?.remarks && (
                          <p className="pl-8 text-xs text-gray-400 mt-0.5">Remarks: {s.attendance.remarks}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </td>
  );
}
