import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { FaTimes } from 'react-icons/fa';
import { feeHeadApi } from '../api/feeHead';
import { FeeHead, CreateFeeHeadRequest, UpdateFeeHeadRequest } from '../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  feeHead?: FeeHead; // if provided → edit mode
};

const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1';
const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const EMPTY_FORM = {
  name: '',
  description: '',
  frequency: 'MONTHLY' as FeeHead['frequency'],
  pricingType: 'FLAT' as FeeHead['pricingType'],
  applicability: 'AUTO' as FeeHead['applicability'],
  flatAmount: '',
};

const FeeHeadModal: React.FC<Props> = ({ isOpen, onClose, feeHead }) => {
  const queryClient = useQueryClient();
  const isEdit = !!feeHead;

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (feeHead) {
      setForm({
        name: feeHead.name,
        description: feeHead.description ?? '',
        frequency: feeHead.frequency,
        pricingType: feeHead.pricingType,
        applicability: feeHead.applicability,
        flatAmount: feeHead.flatAmount !== null ? String(feeHead.flatAmount) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [feeHead, isOpen]);

  const createMutation = useMutation(
    (data: CreateFeeHeadRequest) => feeHeadApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeHeads');
        handleClose();
      },
      onError: (err: Error) => setError(err.message),
    }
  );

  const updateMutation = useMutation(
    (data: UpdateFeeHeadRequest) => feeHeadApi.update(feeHead!.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feeHeads');
        handleClose();
      },
      onError: (err: Error) => setError(err.message),
    }
  );

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (form.pricingType === 'FLAT') {
      const amt = parseFloat(form.flatAmount);
      if (isNaN(amt) || amt < 0) {
        setError('Enter a valid flat amount');
        return;
      }
    }

    setError(null);

    if (isEdit) {
      const payload: UpdateFeeHeadRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        frequency: form.frequency,
        pricingType: form.pricingType,
        applicability: form.applicability,
        flatAmount: form.pricingType === 'FLAT' ? parseFloat(form.flatAmount) : undefined,
      };
      updateMutation.mutate(payload);
    } else {
      const payload: CreateFeeHeadRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        frequency: form.frequency,
        pricingType: form.pricingType,
        applicability: form.applicability,
        flatAmount: form.pricingType === 'FLAT' ? parseFloat(form.flatAmount) : undefined,
      };
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Fee Head' : 'Add Fee Head'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              placeholder="e.g. Library Fee"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              Description <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <input
              className={inputClass}
              placeholder="Brief description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Frequency + Applicability side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Frequency</label>
              <select
                className={inputClass}
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value as FeeHead['frequency'] })
                }
              >
                <option value="MONTHLY">Monthly</option>
                <option value="ONE_TIME">One-time</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Applicability</label>
              <select
                className={inputClass}
                value={form.applicability}
                onChange={(e) =>
                  setForm({ ...form, applicability: e.target.value as FeeHead['applicability'] })
                }
              >
                <option value="AUTO">Auto</option>
                <option value="OPT_IN">Opt-in</option>
              </select>
            </div>
          </div>

          {/* Pricing Type */}
          <div>
            <label className={labelClass}>Pricing Type</label>
            <select
              className={inputClass}
              value={form.pricingType}
              onChange={(e) =>
                setForm({ ...form, pricingType: e.target.value as FeeHead['pricingType'], flatAmount: '' })
              }
            >
              <option value="FLAT">Flat</option>
              <option value="PER_CLASS">Per Class</option>
              <option value="AREA_BASED">Area-based</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Flat Amount — only when FLAT */}
          {form.pricingType === 'FLAT' && (
            <div>
              <label className={labelClass}>Amount (₹)</label>
              <input
                className={inputClass}
                type="text"
                inputMode="decimal"
                placeholder="e.g. 500"
                value={form.flatAmount}
                onChange={(e) => {
                  if (/^\d*\.?\d{0,2}$/.test(e.target.value)) {
                    setForm({ ...form, flatAmount: e.target.value });
                  }
                }}
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[110px] justify-center"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Add Fee Head'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeHeadModal;
