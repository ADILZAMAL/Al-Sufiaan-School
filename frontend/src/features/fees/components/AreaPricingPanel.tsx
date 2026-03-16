import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || '';

type AreaRow = { id?: number; areaName: string; price: string };

type Props = {
  colSpan: number;
};

const AreaPricingPanel: React.FC<Props> = ({ colSpan }) => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<AreaRow[]>([]);
  const deletedIdsRef = useRef<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: areaPricing = [], isLoading } = useQuery(
    'areaPricing',
    async () => {
      const res = await fetch(`${API_BASE_URL}/api/transportation-area-pricing`, { credentials: 'include' });
      const body = await res.json();
      if (!body.success) throw new Error(body.error?.message || 'Failed to fetch');
      return body.data.transportationAreaPricing as Array<{ id: number; areaName: string; price: number }>;
    },
    { staleTime: 5 * 60 * 1000 }
  );

  useEffect(() => {
    if (!isLoading) {
      deletedIdsRef.current = new Set();
      setRows(
        areaPricing.length > 0
          ? areaPricing.map((a) => ({ id: a.id, areaName: a.areaName, price: String(a.price) }))
          : [{ areaName: '', price: '' }]
      );
    }
  }, [areaPricing, isLoading]);

  const saveMutation = useMutation(
    async ({ toUpsert, toDelete }: { toUpsert: Array<{ areaName: string; price: number }>; toDelete: number[] }) => {
      // Delete removed rows first
      await Promise.all(
        toDelete.map((id) =>
          fetch(`${API_BASE_URL}/api/transportation-area-pricing/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        )
      );
      // Upsert remaining rows (skip if empty after deletions)
      if (toUpsert.length > 0) {
        const res = await fetch(`${API_BASE_URL}/api/transportation-area-pricing/bulk-upsert`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricingData: toUpsert }),
        });
        const body = await res.json();
        if (!body.success) throw new Error(body.error?.message || 'Save failed');
      }
    },
    {
      onSuccess: () => {
        deletedIdsRef.current = new Set();
        queryClient.invalidateQueries('areaPricing');
        setSaveError(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (err: Error) => setSaveError(err.message),
    }
  );

  const handleSave = () => {
    const valid = rows.filter((r) => r.areaName.trim() && r.price !== '' && !isNaN(parseFloat(r.price)));
    const toDelete = Array.from(deletedIdsRef.current);
    if (valid.length === 0 && toDelete.length === 0) {
      setSaveError('Enter at least one area with a price');
      return;
    }
    setSaveError(null);
    saveMutation.mutate({
      toUpsert: valid.map((r) => ({ areaName: r.areaName.trim(), price: parseFloat(r.price) })),
      toDelete,
    });
  };

  const updateRow = (i: number, field: keyof AreaRow, value: string) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
    setSaved(false);
  };

  const addRow = () => setRows([...rows, { areaName: '', price: '' }]);

  const removeRow = (i: number) => {
    const row = rows[i];
    if (row.id) deletedIdsRef.current.add(row.id);
    setRows(rows.filter((_, idx) => idx !== i));
    setSaved(false);
  };

  return (
    <td colSpan={colSpan} className="px-0 py-0 bg-indigo-50/40 border-t border-indigo-100">
      <div className="px-10 py-4">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">
          Area-Based Amounts
        </p>

        {isLoading ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="flex flex-col gap-2 max-w-md">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Area name"
                    value={row.areaName}
                    onChange={(e) => updateRow(i, 'areaName', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={row.price}
                      onChange={(e) => {
                        if (/^\d*\.?\d{0,2}$/.test(e.target.value)) updateRow(i, 'price', e.target.value);
                      }}
                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                    />
                  </div>
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addRow}
                className="self-start mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add area
              </button>
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
              {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
            </div>
          </>
        )}
      </div>
    </td>
  );
};

export default AreaPricingPanel;
