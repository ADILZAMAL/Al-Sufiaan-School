import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiPencil, HiPlus, HiCreditCard, HiDocumentText } from 'react-icons/hi';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { getVendorById, getVendorSummary, getVendorPaymentHistory, fetchVendorBills, deleteVendorBill } from '../api';
import { Vendor, VendorSummary, VendorPayment, VendorBill } from '../types';
import AddVendorBillModal from '../components/AddVendorBillModal';
import AddVendorPaymentModal from '../components/AddVendorPaymentModal';
import EditVendorBillModal from '../components/EditVendorBillModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

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
    if (id) {
      loadVendorData(parseInt(id));
    }
  }, [id]);

  const loadVendorData = async (vendorId: number) => {
    setIsLoading(true);
    try {
      const [vendorData, summaryData, paymentsData, billsData] = await Promise.all([
        getVendorById(vendorId),
        getVendorSummary(vendorId),
        getVendorPaymentHistory(vendorId),
        fetchVendorBills(vendorId)
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

  const handleAddBillSuccess = () => {
    // Refresh vendor data to update summary and bills
    if (id) {
      loadVendorData(parseInt(id));
    }
  };

  const handleAddPaymentSuccess = () => {
    // Refresh vendor data to update summary and payments
    if (id) {
      loadVendorData(parseInt(id));
    }
  };

  const handleEditBill = (bill: VendorBill) => {
    setSelectedBill(bill);
    setIsEditBillModalOpen(true);
  };

  const handleEditBillSuccess = () => {
    // Refresh vendor data to update summary and bills
    if (id) {
      loadVendorData(parseInt(id));
    }
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
      // Refresh vendor data to update summary and bills
      if (id) {
        loadVendorData(parseInt(id));
      }
      setIsDeleteConfirmModalOpen(false);
      setBillToDelete(null);
    } catch (error) {
      console.error('Error deleting bill:', error);
      // You could add a toast notification here instead of alert
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmModalOpen(false);
    setBillToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (date: Date | string) => {
    const today = new Date();
    const givenDate = new Date(date);
    return (
      today.getFullYear() === givenDate.getFullYear() &&
      today.getMonth() === givenDate.getMonth() &&
      today.getDate() === givenDate.getDate()
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor not found</h2>
          <button
            onClick={() => navigate('/dashboard/expense/vendors')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/expense/vendors')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsAddBillModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Add Bill
          </button>
          <button 
            onClick={() => setIsAddPaymentModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <HiCreditCard className="w-4 h-4" />
            Make Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HiDocumentText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalBills)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <HiCreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPayments)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <HiDocumentText className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Due Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.dueAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('bills')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bills
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vendor Details
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Vendor Information</h3>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <HiPencil className="w-4 h-4" />
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.mobile}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.category?.name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UPI ID</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.upiNumberId || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.accountNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.ifscCode || 'N/A'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-sm text-gray-900">{vendor.address || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(vendor.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(bill.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.user ? `${bill.user.firstName} ${bill.user.lastName}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isToday(bill.createdAt) && (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleEditBill(bill)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteBillClick(bill)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vendor Bill Modal */}
      {vendor && (
        <AddVendorBillModal
          isOpen={isAddBillModalOpen}
          onClose={() => setIsAddBillModalOpen(false)}
          onSuccess={handleAddBillSuccess}
          vendorId={vendor.id}
          vendorName={vendor.name}
        />
      )}

      {/* Add Vendor Payment Modal */}
      {vendor && summary && (
        <AddVendorPaymentModal
          isOpen={isAddPaymentModalOpen}
          onClose={() => setIsAddPaymentModalOpen(false)}
          onSuccess={handleAddPaymentSuccess}
          vendorId={vendor.id}
          vendorName={vendor.name}
          dueAmount={summary.dueAmount}
        />
      )}

      {/* Edit Vendor Bill Modal */}
      {vendor && (
        <EditVendorBillModal
          isOpen={isEditBillModalOpen}
          onClose={() => setIsEditBillModalOpen(false)}
          onSuccess={handleEditBillSuccess}
          bill={selectedBill}
          vendorName={vendor.name}
        />
      )}

      {/* Confirm Delete Modal */}
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
