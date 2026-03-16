import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { feeHeadApi } from '../api/feeHead';
import { classesApi } from '../api/classFeePricing';
import { FeeHeadClassPricingItem } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';

type Props = {
  feeHeadId: number;
  colSpan: number;
};

const ClassPricingPanel: React.FC<Props> = ({ feeHeadId, colSpan }) => {
  const queryClient = useQueryClient();

  const { data: activeSession } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession
  );

  const { data: classes = [], isLoading: classesLoading } = useQuery(
    ['allClasses', activeSession?.id],
    () => activeSession ? classesApi.getBySession(activeSession.id) : Promise.resolve([]),
    { enabled: !!activeSession, staleTime: 5 * 60 * 1000 }
  );

  const { data: pricing = [], isLoading: pricingLoading } = useQuery<FeeHeadClassPricingItem[]>(
    ['classPricing', feeHeadId],
    () => feeHeadApi.getClassPricing(feeHeadId)
  );

  // Local editable amounts keyed by classId
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed amounts from fetched pricing
  useEffect(() => {
    if (!pricingLoading && pricing.length >= 0) {
      const map: Record<number, string> = {};
      pricing.forEach((p) => {
        map[p.classId] = String(p.amount);
      });
      setAmounts(map);
    }
  }, [pricing, pricingLoading]);

  const saveMutation = useMutation(
    (pricingData: Array<{ classId: number; amount: number }>) =>
      feeHeadApi.bulkUpsertClassPricing(feeHeadId, { pricingData }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classPricing', feeHeadId]);
        setSaveError(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (err: Error) => setSaveError(err.message),
    }
  );

  const handleSave = () => {
    const pricingData = classes
      .filter((cls) => {
        const val = amounts[cls.id];
        return val !== undefined && val !== '' && !isNaN(parseFloat(val));
      })
      .map((cls) => ({ classId: cls.id, amount: parseFloat(amounts[cls.id]) }));

    if (pricingData.length === 0) {
      setSaveError('Enter at least one amount to save');
      return;
    }
    setSaveError(null);
    saveMutation.mutate(pricingData);
  };

  const isLoading = classesLoading || pricingLoading;

  return (
    <td colSpan={colSpan} className="px-0 py-0 bg-indigo-50/40 border-t border-indigo-100">
      <div className="px-10 py-4">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">
          Per-Class Amounts
        </p>

        {isLoading ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="text-sm text-gray-400">No classes found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {classes.map((cls) => (
                <div key={cls.id}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {cls.name}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={amounts[cls.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d{0,2}$/.test(val)) {
                          setAmounts({ ...amounts, [cls.id]: val });
                          setSaved(false);
                        }
                      }}
                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {saveError && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-1.5">
                {saveError}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saveMutation.isLoading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saveMutation.isLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Amounts'
                )}
              </button>
              {saved && (
                <span className="text-xs text-green-600 font-medium">Saved!</span>
              )}
            </div>
          </>
        )}
      </div>
    </td>
  );
};

export default ClassPricingPanel;
