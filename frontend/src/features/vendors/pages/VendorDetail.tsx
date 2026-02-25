import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiPlus, HiCreditCard, HiDocumentText } from 'react-icons/hi';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { getVendorById, getVendorSummary, getVendorPaymentHistory, fetchVendorBills, deleteVendorBill } from '../api';
import { Vendor, VendorSummary, VendorPayment, VendorBill } from '../types';
import AddVendorBillModal from '../components/AddVendorBillModal';
import AddVendorPaymentModal from '../components/AddVendorPaymentModal';
import EditVendorBillModal from '../components/EditVendorBillModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

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

const METHOD_LABELS: Record<string, { label: string; cls: string }> = {
  cash: { label: 'Cash', cls: 'bg-gray-100 text-gray-600' },
  bank_transfer: { label: 'Bank Transfer', cls: 'bg-blue-100 text-blue-700' },
  upi: { label: 'UPI', cls: 'bg-purple-100 text-purple-700' },
  cheque: { label: 'Cheque', cls: 'bg-orange-100 text-orange-700' },
  card: { label: 'Card', cls: 'bg-indigo-100 text-indigo-700' },
};

const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'bills'>('bills');
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isEditBillModalOpen, setIsEditBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<VendorBill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) loadVendorData(parseInt(id));
  }, [id]);

  const loadVendorData = async (vendorId: number) => {
    setIsLoading(true);
    try {
      const [vendorData, summaryData, paymentsData, billsData] = await Promise.all([
        getVendorById(vendorId),
        getVendorSummary(vendorId),
        getVendorPaymentHistory(vendorId),
        fetchVendorBills(vendorId),
      ]);
      setVendor(vendorData);
      setSummary(summaryData);
      setPayments(paymentsData);
      setBills(billsData);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => { if (id) loadVendorData(parseInt(id)); };

  const handleEditBill = (bill: VendorBill) => {
    setSelectedBill(bill);
    setIsEditBillModalOpen(true);
  };

  const handleEditBillSuccess = () => {
    refresh();
    setSelectedBill(null);
  };

  const handleDeleteBillClick = (bill: VendorBill) => {
    setBillToDelete(bill);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);
    try {
      await deleteVendorBill(billToDelete.id);
      refresh();
      setIsDeleteConfirmModalOpen(false);
      setBillToDelete(null);
    } catch (error) {
      console.error('Error deleting bill:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmModalOpen(false);
    setBillToDelete(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const isToday = (date: Date | string) => {
    const today = new Date();
    const d = new Date(date);
    return (
      today.getFullYear() === d.getFullYear() &&
      today.getMonth() === d.getMonth() &&
      today.getDate() === d.getDate()
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 font-medium">Vendor not found.</p>
        <button
          onClick={() => navigate('/dashboard/expense/vendors')}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'bills' as const, label: 'Bills', count: bills.length },
    { key: 'payments' as const, label: 'Payments', count: payments.length },
    { key: 'details' as const, label: 'Details' },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/expense/vendors')}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
            >
              <HiArrowLeft className="w-4 h-4" />
            </button>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${getAvatarColor(vendor.name)}`}
            >
              {vendor.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{vendor.name}</h1>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    vendor.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {vendor.category && (
                <p className="text-sm text-gray-500">{vendor.category.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddBillModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <HiPlus className="w-4 h-4" />
              Add Bill
            </button>
            <button
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <HiCreditCard className="w-4 h-4" />
              Make Payment
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <HiDocumentText className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Bills</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalBills)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <HiCreditCard className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Paid</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalPayments)}</p>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
                summary.dueAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    summary.dueAmount > 0 ? 'bg-red-100' : 'bg-gray-100'
                  }`}
                >
                  <HiDocumentText
                    className={`w-5 h-5 ${summary.dueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Due Amount</p>
                  <p
                    className={`text-lg font-bold ${
                      summary.dueAmount > 0 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(summary.dueAmount)}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                  summary.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : summary.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {summary.status}
              </span>
            </div>
          </div>
        )}

        {/* Pill Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {'count' in tab && (tab.count ?? 0) > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bills Tab */}
        {activeTab === 'bills' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Bills</h3>
            </div>
            {bills.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <HiDocumentText className="text-gray-300 w-5 h-5" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No bills yet</p>
                <button
                  onClick={() => setIsAddBillModalOpen(true)}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Add the first bill
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <HiDocumentText className="text-blue-500 w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bill.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(bill.createdAt)}
                          {bill.user && ` · ${bill.user.firstName} ${bill.user.lastName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(bill.amount)}
                      </span>
                      {isToday(bill.createdAt) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteBillClick(bill)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Payment History</h3>
            </div>
            {payments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <HiCreditCard className="text-gray-300 w-5 h-5" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No payments yet</p>
                <button
                  onClick={() => setIsAddPaymentModalOpen(true)}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Make the first payment
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <HiCreditCard className="text-emerald-500 w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              (METHOD_LABELS[payment.paymentMethod] ?? { cls: 'bg-gray-100 text-gray-600' }).cls
                            }`}
                          >
                            {(METHOD_LABELS[payment.paymentMethod] ?? { label: payment.paymentMethod }).label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {payment.user && `${payment.user.firstName} ${payment.user.lastName}`}
                          {payment.notes && ` · ${payment.notes}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 shrink-0 ml-4">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Vendor Information</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {[
                { label: 'Name', value: vendor.name },
                { label: 'Mobile', value: vendor.mobile },
                { label: 'Category', value: vendor.category?.name ?? '—' },
                { label: 'Status', value: vendor.isActive ? 'Active' : 'Inactive' },
                { label: 'UPI ID', value: vendor.upiNumberId ?? '—' },
                { label: 'Account Number', value: vendor.accountNumber ?? '—' },
                { label: 'IFSC Code', value: vendor.ifscCode ?? '—' },
                { label: 'Created', value: formatDate(vendor.createdAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{value}</p>
                </div>
              ))}
              {vendor.address && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Address
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{vendor.address}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {vendor && (
        <AddVendorBillModal
          isOpen={isAddBillModalOpen}
          onClose={() => setIsAddBillModalOpen(false)}
          onSuccess={refresh}
          vendorId={vendor.id}
          vendorName={vendor.name}
        />
      )}

      {vendor && summary && (
        <AddVendorPaymentModal
          isOpen={isAddPaymentModalOpen}
          onClose={() => setIsAddPaymentModalOpen(false)}
          onSuccess={refresh}
          vendorId={vendor.id}
          vendorName={vendor.name}
          dueAmount={summary.dueAmount}
        />
      )}

      {vendor && (
        <EditVendorBillModal
          isOpen={isEditBillModalOpen}
          onClose={() => setIsEditBillModalOpen(false)}
          onSuccess={handleEditBillSuccess}
          bill={selectedBill}
          vendorName={vendor.name}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Bill"
        message={`Are you sure you want to delete the bill "${billToDelete?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default VendorDetail;
