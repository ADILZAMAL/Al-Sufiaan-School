import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import { studentApi } from '../api';
import { StudentTagLookupResult } from '../types';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-emerald-100 text-emerald-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
];

const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const LostAndFound: React.FC = () => {
  const navigate = useNavigate();
  const [tagNumber, setTagNumber] = useState('');
  const [result, setResult] = useState<StudentTagLookupResult | null>(null);

  const mutation = useMutation(
    (tag: string) => studentApi.lookupByTagNumber(tag),
    {
      onSuccess: (response) => {
        setResult(response.data);
      },
      onError: () => {
        setResult(null);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagNumber) return;
    setResult(null);
    mutation.mutate(tagNumber);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => navigate('/dashboard/students')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <FaArrowLeft className="w-3 h-3" />
            Back to Students
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaSearch className="text-blue-600" />
            Lost &amp; Found
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the tag number stitched or stuck on an item to find its owner
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
        >
          <input
            type="number"
            min={1}
            autoFocus
            value={tagNumber}
            onChange={(e) => setTagNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
            }}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="Enter tag number, e.g. 42"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            disabled={!tagNumber || mutation.isLoading}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isLoading ? 'Searching...' : 'Find'}
          </button>
        </form>

        {mutation.isError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-700 text-sm font-medium">
              {(mutation.error as Error)?.message || 'No student found with this tag number'}
            </p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              {result.studentPhoto ? (
                <img
                  src={result.studentPhoto}
                  alt={result.name}
                  className="h-14 w-14 rounded-full object-cover border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0 ${getAvatarColor(result.name)}`}>
                  <FiUser className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">{result.name}</p>
                <p className="text-sm text-gray-500">
                  Admission No: {result.admissionNumber}
                  {result.className ? ` · ${result.className}${result.sectionName ? ` - ${result.sectionName}` : ''}` : ''}
                </p>
                {result.hostel && (
                  <span className="inline-block mt-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                    Hostel Student
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(`/dashboard/students/${result.id}`)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Full Profile →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LostAndFound;
