import React from 'react';
import { useQuery } from 'react-query';
import { academicSessionApi } from '../api';
import { AcademicSession } from '../types';

interface Props {
  value: number | null;
  onChange: (sessionId: number) => void;
  className?: string;
}

const SessionSelector: React.FC<Props> = ({ value, onChange, className = '' }) => {
  const { data: sessions = [], isLoading } = useQuery<AcademicSession[]>(
    'fetchSessions',
    academicSessionApi.getSessions,
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">Loading sessions...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-amber-600 font-medium">No academic sessions found</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Session:</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
      >
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name}
            {session.isActive ? ' (Active)' : ''}
          </option>
        ))}
      </select>
      {value !== null && sessions.find(s => s.id === value)?.isActive && (
        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
          Active
        </span>
      )}
    </div>
  );
};

export default SessionSelector;
