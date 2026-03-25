import React, { useState, useEffect } from 'react';
import { FiX, FiTruck, FiLock } from 'react-icons/fi';
import { transportationAreaPricingApi } from '../../transportation/api/transportationAreaPricing';
import { feeHeadApi } from '../../fees/api/feeHead';
import { FeeHead } from '../../fees/types';
import { getLastGeneratedFee } from '../api';

interface TransportationArea {
  id: number;
  areaName: string;
  price: number;
}

interface PrefillFeeItem {
  feeHeadId?: number | null;
  amount: number;
  note?: string | null;
  transportationAreaId?: number | null;
}

interface PrefillEntry {
  feeItems?: PrefillFeeItem[] | null;
  totalAdjustment?: number;
  discountReason?: string | null;
}

interface GenerateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (feeData: {
    month: number;
    calendarYear: number;
    feeHeadIds: number[];
    customAmounts: Record<number, number>;
    notes: Record<number, string>;
    transportationAreaId?: number;
    discount: number;
    discountReason?: string;
  }) => Promise<void>;
  month: number;
  calendarYear: number;
  label: string;
  loading?: boolean;
  studentId: number;
  prefillEntry?: PrefillEntry | null;
}

const GenerateFeeModal: React.FC<GenerateFeeModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  month,
  calendarYear,
  label,
  loading = false,
  studentId,
  prefillEntry,
}) => {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(false);

  const [transportationAreas, setTransportationAreas] = useState<TransportationArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // OPT_IN heads that are checked
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // AREA_BASED: feeHeadId → transportationAreaId
  const [areaByHead, setAreaByHead] = useState<Record<number, number>>({});
  // CUSTOM: feeHeadId → amount string / note string
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setAreaByHead({});
      setCustomAmounts({});
      setNotes({});
      setDiscount(0);
      setDiscountReason('');
      setError('');
      fetchData();
    }
  }, [isOpen]);

  const populateFromPrevious = (
    heads: FeeHead[],
    areas: TransportationArea[],
    source: PrefillEntry
  ) => {
    const items = source.feeItems ?? [];
    const optInHeads = heads.filter((h) => h.applicability === 'OPT_IN');
    const newSelectedIds = new Set<number>();
    const newCustomAmounts: Record<number, string> = {};
    const newNotes: Record<number, string> = {};
    const newAreaByHead: Record<number, number> = {};

    for (const head of optInHeads) {
      const item = items.find((i) => i.feeHeadId === head.id);
      if (!item) continue;
      newSelectedIds.add(head.id);
      if (head.pricingType === 'CUSTOM') {
        newCustomAmounts[head.id] = String(item.amount);
        if (item.note) newNotes[head.id] = item.note;
      }
      if (head.pricingType === 'AREA_BASED' && item.transportationAreaId) {
        newAreaByHead[head.id] = item.transportationAreaId;
      }
    }

    setSelectedIds(newSelectedIds);
    setCustomAmounts(newCustomAmounts);
    setNotes(newNotes);
    setAreaByHead(newAreaByHead);
    if (source.totalAdjustment && source.totalAdjustment > 0) {
      setDiscount(source.totalAdjustment);
      setDiscountReason(source.discountReason ?? '');
    }
  };

  const fetchData = async () => {
    setLoadingHeads(true);
    setLoadingAreas(true);
    try {
      const requests: [Promise<FeeHead[]>, Promise<any>, Promise<any> | undefined] = [
        feeHeadApi.getAll(),
        transportationAreaPricingApi.getAll(),
        prefillEntry === undefined ? getLastGeneratedFee(studentId) : Promise.resolve(undefined),
      ];
      const [heads, areasResponse, lastFee] = await Promise.all(requests);
      const activeHeads = heads.filter((h) => h.isActive);
      const areas: TransportationArea[] = areasResponse.transportationAreaPricing || [];
      setFeeHeads(activeHeads);
      setTransportationAreas(areas);

      const source: PrefillEntry | null = prefillEntry ?? lastFee ?? null;
      if (source?.feeItems?.length) {
        populateFromPrevious(activeHeads, areas, source);
      }
    } catch (err) {
      setError('Failed to load fee data');
    } finally {
      setLoadingHeads(false);
      setLoadingAreas(false);
    }
  };

  const toggleHead = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setAreaByHead((a) => { const n = { ...a }; delete n[id]; return n; });
        setCustomAmounts((a) => { const n = { ...a }; delete n[id]; return n; });
        setNotes((a) => { const n = { ...a }; delete n[id]; return n; });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const optInHeads = feeHeads.filter((h) => h.applicability === 'OPT_IN');

    // Validate CUSTOM heads
    for (const head of optInHeads.filter((h) => h.pricingType === 'CUSTOM')) {
      if (selectedIds.has(head.id)) {
        const amt = parseFloat(customAmounts[head.id] ?? '');
        if (isNaN(amt) || amt <= 0) {
          setError(`Enter a valid amount for "${head.name}"`);
          return;
        }
      }
    }

    // Validate AREA_BASED heads
    for (const head of optInHeads.filter((h) => h.pricingType === 'AREA_BASED')) {
      if (selectedIds.has(head.id) && !areaByHead[head.id]) {
        setError(`Select a transportation area for "${head.name}"`);
        return;
      }
    }

    const feeHeadIds = [...selectedIds];

    const customAmountsPayload: Record<number, number> = {};
    const notesPayload: Record<number, string> = {};
    for (const head of optInHeads.filter((h) => h.pricingType === 'CUSTOM')) {
      if (selectedIds.has(head.id)) {
        customAmountsPayload[head.id] = parseFloat(customAmounts[head.id]);
        if (notes[head.id]?.trim()) notesPayload[head.id] = notes[head.id].trim();
      }
    }

    const areaBasedSelected = optInHeads.find(
      (h) => h.pricingType === 'AREA_BASED' && selectedIds.has(h.id)
    );
    const transportationAreaId = areaBasedSelected ? areaByHead[areaBasedSelected.id] : undefined;

    try {
      await onGenerate({
        month,
        calendarYear,
        feeHeadIds,
        customAmounts: customAmountsPayload,
        notes: notesPayload,
        transportationAreaId,
        discount,
        discountReason: discountReason || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate fee');
    }
  };

  const autoHeads = feeHeads.filter((h) => h.applicability === 'AUTO');
  const optInHeads = feeHeads.filter((h) => h.applicability === 'OPT_IN');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generate Fee</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Month/Year */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Month/Year</p>
            <p className="text-lg font-bold text-blue-700">{label}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loadingHeads ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading fee heads...</div>
            ) : (
              <>
                {/* AUTO heads — always included, locked */}
                {autoHeads.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Included Automatically
                    </p>
                    <div className="space-y-2">
                      {autoHeads.map((head) => (
                        <div
                          key={head.id}
                          className="flex items-center p-3 border border-gray-100 rounded-lg bg-gray-50"
                        >
                          <FiLock className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 flex-1">
                            {head.name}
                            {head.pricingType === 'FLAT' && head.flatAmount !== null && (
                              <span className="ml-2 text-xs text-gray-400">
                                ₹{head.flatAmount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">Auto</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OPT_IN heads */}
                {optInHeads.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Optional Fees
                    </p>
                    <div className="space-y-2">
                      {optInHeads.map((head) => {
                        const checked = selectedIds.has(head.id);
                        return (
                          <div key={head.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div
                              className="flex items-center p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => !loading && toggleHead(head.id)}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleHead(head.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={loading}
                              />
                              <span className="ml-3 text-sm font-medium text-gray-700 flex-1">
                                {head.name}
                                {head.pricingType === 'FLAT' && head.flatAmount !== null && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    ₹{head.flatAmount.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-gray-400 capitalize">
                                {head.pricingType.toLowerCase().replace('_', ' ')}
                              </span>
                            </div>

                            {/* AREA_BASED: area dropdown when checked */}
                            {checked && head.pricingType === 'AREA_BASED' && (
                              <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
                                <div className="relative mt-2">
                                  <select
                                    value={areaByHead[head.id] || ''}
                                    onChange={(e) =>
                                      setAreaByHead({ ...areaByHead, [head.id]: parseInt(e.target.value) })
                                    }
                                    disabled={loading || loadingAreas}
                                    className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                  >
                                    <option value="">Select area...</option>
                                    {transportationAreas.map((area) => (
                                      <option key={area.id} value={area.id}>
                                        {area.areaName} — ₹{area.price.toLocaleString('en-IN')}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiTruck className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CUSTOM: amount + note when checked */}
                            {checked && head.pricingType === 'CUSTOM' && (
                              <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100 space-y-2">
                                <div className="relative mt-2">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">₹</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Amount"
                                    value={customAmounts[head.id] ?? ''}
                                    onChange={(e) => {
                                      if (/^\d*\.?\d{0,2}$/.test(e.target.value)) {
                                        setCustomAmounts({ ...customAmounts, [head.id]: e.target.value });
                                      }
                                    }}
                                    disabled={loading}
                                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Note (optional, e.g. Doctor visit 12 Mar)"
                                  value={notes[head.id] ?? ''}
                                  onChange={(e) => setNotes({ ...notes, [head.id]: e.target.value })}
                                  disabled={loading}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount (₹)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="block w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">₹</span>
                </div>
              </div>
            </div>

            {discount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Reason <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for discount..."
                  disabled={loading}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading || loadingHeads}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Fee'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenerateFeeModal;
