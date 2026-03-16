import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { HiOutlinePencil, HiOutlinePlus, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { feeHeadApi } from '../api/feeHead';
import { FeeHead } from '../types';
import FeeHeadModal from '../components/FeeHeadModal';
import ClassPricingPanel from '../components/ClassPricingPanel';
import AreaPricingPanel from '../components/AreaPricingPanel';

const FREQUENCY_LABELS: Record<FeeHead['frequency'], string> = {
  MONTHLY: 'Monthly',
  ONE_TIME: 'One-time',
};

const PRICING_TYPE_LABELS: Record<FeeHead['pricingType'], string> = {
  FLAT: 'Flat',
  PER_CLASS: 'Per Class',
  AREA_BASED: 'Area-based',
  CUSTOM: 'Custom',
};

const APPLICABILITY_LABELS: Record<FeeHead['applicability'], string> = {
  AUTO: 'Auto',
  OPT_IN: 'Opt-in',
};

const FREQUENCY_COLORS: Record<FeeHead['frequency'], string> = {
  MONTHLY: 'bg-green-100 text-green-800',
  ONE_TIME: 'bg-purple-100 text-purple-800',
};

const PRICING_TYPE_COLORS: Record<FeeHead['pricingType'], string> = {
  FLAT: 'bg-gray-100 text-gray-800',
  PER_CLASS: 'bg-indigo-100 text-indigo-800',
  AREA_BASED: 'bg-orange-100 text-orange-800',
  CUSTOM: 'bg-yellow-100 text-yellow-800',
};

const APPLICABILITY_COLORS: Record<FeeHead['applicability'], string> = {
  AUTO: 'bg-blue-100 text-blue-800',
  OPT_IN: 'bg-slate-100 text-slate-700',
};

const formatAmount = (amount: number | null): string => {
  if (amount === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const FeeHeads: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeeHead | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { data: feeHeads = [], isLoading, isError, error } = useQuery<FeeHead[], Error>(
    'feeHeads',
    feeHeadApi.getAll
  );

  const toggleActiveMutation = useMutation(
    ({ id, isActive }: { id: number; isActive: boolean }) =>
      feeHeadApi.update(id, { isActive }),
    {
      onSuccess: () => queryClient.invalidateQueries('feeHeads'),
    }
  );

  const openAdd = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const openEdit = (head: FeeHead) => {
    setEditTarget(head);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500">Loading fee heads...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          Failed to load fee heads: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fee Heads</h1>
            <p className="text-sm text-gray-500 mt-1">Manage fee types applied to students</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <HiOutlinePlus className="text-base" />
            Add Fee Head
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {feeHeads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No fee heads configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feeHeads.map((head) => {
                    const isExpanded = expandedIds.has(head.id);
                    return (
                      <React.Fragment key={head.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{head.name}</div>
                            {head.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{head.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${FREQUENCY_COLORS[head.frequency]}`}>
                              {FREQUENCY_LABELS[head.frequency]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${PRICING_TYPE_COLORS[head.pricingType]}`}>
                              {PRICING_TYPE_LABELS[head.pricingType]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${APPLICABILITY_COLORS[head.applicability]}`}>
                              {APPLICABILITY_LABELS[head.applicability]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {head.pricingType === 'FLAT' ? formatAmount(head.flatAmount) : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleActiveMutation.mutate({ id: head.id, isActive: !head.isActive })}
                              disabled={toggleActiveMutation.isLoading}
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-40 ${
                                head.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {head.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(head.pricingType === 'PER_CLASS' || head.pricingType === 'AREA_BASED') && (
                                <button
                                  onClick={() => toggleExpand(head.id)}
                                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors"
                                  title={isExpanded ? 'Collapse pricing' : 'Set pricing'}
                                >
                                  {isExpanded ? (
                                    <HiChevronUp className="text-base" />
                                  ) : (
                                    <HiChevronDown className="text-base" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => openEdit(head)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Edit"
                              >
                                <HiOutlinePencil className="text-base" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {head.pricingType === 'PER_CLASS' && isExpanded && (
                          <tr>
                            <ClassPricingPanel feeHeadId={head.id} colSpan={7} />
                          </tr>
                        )}
                        {head.pricingType === 'AREA_BASED' && isExpanded && (
                          <tr>
                            <AreaPricingPanel colSpan={7} />
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FeeHeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feeHead={editTarget}
      />
    </>
  );
};

export default FeeHeads;
