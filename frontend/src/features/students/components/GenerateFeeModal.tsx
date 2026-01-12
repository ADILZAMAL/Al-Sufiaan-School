import React, { useState, useEffect } from 'react';
import { FiX, FiHome, FiTruck, FiUserPlus, FiSun } from 'react-icons/fi';
import { transportationAreaPricingApi } from '../../transportation/api/transportationAreaPricing';

interface TransportationArea {
  id: number;
  areaName: string;
  price: number;
}

interface GenerateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (feeData: {
    month: number;
    calendarYear: number;
    hostel: boolean;
    newAdmission: boolean;
    transportationAreaId?: number;
    dayboarding: boolean;
    discount: number;
    discountReason?: string;
  }) => Promise<void>;
  month: number;
  calendarYear: number;
  label: string;
  loading?: boolean;
  studentDayboarding?: boolean; // For auto-selecting dayboarding
}

const GenerateFeeModal: React.FC<GenerateFeeModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  month,
  calendarYear,
  label,
  loading = false,
  studentDayboarding = false,
}) => {
  const [hostel, setHostel] = useState(false);
  const [dayboarding, setDayboarding] = useState(false);
  const [newAdmission, setNewAdmission] = useState(false);
  const [transportationAreaId, setTransportationAreaId] = useState<number | undefined>(undefined);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [transportationAreas, setTransportationAreas] = useState<TransportationArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setHostel(false);
      setDayboarding(studentDayboarding); // Auto-select if student has dayboarding
      setNewAdmission(false);
      setTransportationAreaId(undefined);
      setDiscount(0);
      setDiscountReason('');
      setError('');

      // Fetch transportation areas
      fetchTransportationAreas();
    }
  }, [isOpen]);

  const fetchTransportationAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await transportationAreaPricingApi.getAll();
      setTransportationAreas(response.transportationAreaPricing || []);
    } catch (err) {
      console.error('Failed to fetch transportation areas:', err);
      setError('Failed to load transportation areas');
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (hostel && transportationAreaId) {
      setError('Student cannot have both hostel and transportation services');
      return;
    }

    try {
      await onGenerate({
        month,
        calendarYear,
        hostel,
        newAdmission,
        transportationAreaId,
        dayboarding,
        discount,
        discountReason: discountReason || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate fee');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generate Fee</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Month/Year display */}
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
            {/* Hostel Fee */}
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                id="hostel"
                checked={hostel}
                onChange={(e) => {
                  setHostel(e.target.checked);
                  if (e.target.checked) {
                    setTransportationAreaId(undefined);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="hostel" className="ml-3 flex items-center cursor-pointer">
                <FiHome className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Hostel Fee Applicable</span>
              </label>
            </div>

            {/* New Admission Fee */}
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                id="newAdmission"
                checked={newAdmission}
                onChange={(e) => setNewAdmission(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="newAdmission" className="ml-3 flex items-center cursor-pointer">
                <FiUserPlus className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">New Admission Fee Applicable</span>
              </label>
            </div>

            {/* Dayboarding Fee */}
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                id="dayboarding"
                checked={dayboarding}
                onChange={(e) => setDayboarding(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="dayboarding" className="ml-3 flex items-center cursor-pointer">
                <FiSun className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Dayboarding Fee Applicable</span>
              </label>
            </div>

            {/* Transportation Area */}
            <div>
              <label htmlFor="transportation" className="block text-sm font-medium text-gray-700 mb-2">
                Transportation Area
              </label>
              <div className="relative">
                <select
                  id="transportation"
                  value={transportationAreaId || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setTransportationAreaId(value);
                    if (value) {
                      setHostel(false);
                    }
                  }}
                  disabled={loading || loadingAreas || hostel}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">No Transportation</option>
                  {transportationAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.areaName} - ₹{area.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTruck className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {hostel && (
                <p className="mt-1 text-xs text-gray-500">Not available with hostel</p>
              )}
            </div>

            {/* Discount */}
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="discount"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">₹</span>
                </div>
              </div>
            </div>

            {/* Discount Reason */}
            <div>
              <label htmlFor="discountReason" className="block text-sm font-medium text-gray-700 mb-2">
                Discount Reason (Optional)
              </label>
              <textarea
                id="discountReason"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for discount..."
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
