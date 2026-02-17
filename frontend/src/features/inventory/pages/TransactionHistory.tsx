import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { FaChevronDown, FaChevronUp, FaCheck, FaClock, FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getCurrentSchool } from "../../../api/school";

const TransactionHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [verifyingTransactions, setVerifyingTransactions] = useState<Set<number>>(new Set());
  
  const queryClient = useQueryClient();

  const { data: school } = useQuery("currentSchool", getCurrentSchool);
  const paymentModes: string[] = school?.paymentModes || [];

  const effectivePaymentMode = paymentModeFilter === "all" ? undefined : paymentModeFilter;
  const effectiveStatus = statusFilter === "all" ? undefined : statusFilter;

  const { data: transactionData, isLoading } = useQuery(
    ["fetchTransactions", currentPage, effectivePaymentMode, effectiveStatus],
    () => apiClient.fetchTransactions(currentPage, 20, effectivePaymentMode, effectiveStatus),
    {
      keepPreviousData: true,
    }
  );

  const toggleTransactionExpansion = (transactionId: number) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedTransactions(new Set()); // Reset expanded rows when changing pages
  };

  // Mutation for verifying transactions
  const verifyTransactionMutation = useMutation(
    (transactionId: number) => apiClient.verifyTransaction(transactionId),
    {
      onMutate: (transactionId) => {
        setVerifyingTransactions(prev => new Set(prev).add(transactionId));
      },
      onSuccess: () => {
        // Refetch transactions to get updated data
        queryClient.invalidateQueries(["fetchTransactions"]);
      },
      onError: (error: any) => {
        console.error("Error verifying transaction:", error);
        alert(error.message || "Failed to verify transaction");
      },
      onSettled: (_, __, transactionId) => {
        setVerifyingTransactions(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }
    }
  );

  const handleVerifyTransaction = (transactionId: number) => {
    if (window.confirm("Are you sure you want to verify this transaction?")) {
      verifyTransactionMutation.mutate(transactionId);
    }
  };

  const renderVerificationStatus = (transaction: TransactionType) => {
    if (transaction.isVerified) {
      return (
        <div className="flex items-center space-x-1">
          <FaCheckCircle className="text-green-500 text-sm" />
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Verified
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1">
          <FaClock className="text-yellow-500 text-sm" />
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Pending
          </span>
        </div>
      );
    }
  };

  const renderVerificationAction = (transaction: TransactionType) => {
    if (transaction.isVerified) {
      return (
        <span className="text-xs text-gray-500">
          Verified by {transaction.verifiedBy}
        </span>
      );
    } else {
      const isVerifying = verifyingTransactions.has(transaction.id);
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVerifyTransaction(transaction.id);
          }}
          disabled={isVerifying}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <FaCheck className="text-xs" />
              <span>Verify</span>
            </>
          )}
        </button>
      );
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Transaction History</h2>
            <Link
              to="/dashboard/inventory"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Inventory
            </Link>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm bg-white"
                  value={paymentModeFilter}
                  onChange={(e) => {
                    setPaymentModeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Modes</option>
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm bg-white"
                  value={statusFilter}
                  onChange={(e) => {
                    const value = e.target.value as "all" | "verified" | "pending";
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class - Section
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sold By
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(transactionData?.transactions || []).map((transaction: TransactionType) => (
                      <React.Fragment key={transaction.id}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleTransactionExpansion(transaction.id)}
                        >
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.studentName}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                            {transaction.className} - {transaction.sectionName}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                            {transaction.modeOfPayment}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                            {transaction.soldBy}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ₹{transaction.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm">
                            {renderVerificationStatus(transaction)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm">
                            {renderVerificationAction(transaction)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-400">
                            {expandedTransactions.has(transaction.id) ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </td>
                        </tr>
                        {expandedTransactions.has(transaction.id) && (
                          <tr>
                            <td colSpan={9} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-gray-800">Products Purchased:</h4>
                                  <span className="text-sm text-gray-600">
                                    Transaction ID: #{transaction.id}
                                  </span>
                                </div>
                                <div className="grid gap-2">
                                  {transaction.transactionItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-4 bg-white rounded border">
                                      <span className="text-sm font-medium text-gray-900">
                                        {item.productName}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        Qty: {item.quantity} × ₹{item.unitPrice} = ₹{item.totalPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-sm font-medium text-gray-800">
                                      Total Amount: ₹{transaction.totalAmount.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      Payment: {transaction.modeOfPayment}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <div className="flex items-center space-x-2">
                                      {renderVerificationStatus(transaction)}
                                    </div>
                                    {transaction.isVerified && transaction.verifiedBy && (
                                      <span className="text-xs text-gray-500">
                                        Verified by {transaction.verifiedBy}
                                        {transaction.verifiedAt && (
                                          <span className="block">
                                            on {formatDate(transaction.verifiedAt)}
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {(!transactionData?.transactions || transactionData.transactions.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    {paymentModeFilter === "all" && statusFilter === "all"
                      ? "No transactions found."
                      : "No transactions found for the selected filters."}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {transactionData?.pagination && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing page {transactionData.pagination.currentPage} of {transactionData.pagination.totalPages}
                  {" "}({transactionData.pagination.totalItems} total transactions)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, transactionData.pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > transactionData.pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 text-sm border rounded-lg ${
                          pageNum === currentPage
                            ? "bg-blue-600 text-white border-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === transactionData.pagination.totalPages}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
