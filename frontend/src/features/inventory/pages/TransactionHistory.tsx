import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { FaChevronDown, FaChevronUp, FaCheck, FaCheckCircle, FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getCurrentSchool } from "../../../api/school";
import { useAppContext } from "../../../providers/AppContext";

const TransactionHistory = () => {
  const { userRole } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [pendingVerifyId, setPendingVerifyId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: school } = useQuery("currentSchool", getCurrentSchool);
  const paymentModes: string[] = school?.paymentModes || [];

  const effectivePaymentMode = paymentModeFilter === "all" ? undefined : paymentModeFilter;
  const effectiveStatus = statusFilter === "all" ? undefined : statusFilter;

  const { data: transactionData, isLoading } = useQuery(
    ["fetchTransactions", currentPage, effectivePaymentMode, effectiveStatus],
    () => apiClient.fetchTransactions(currentPage, 20, effectivePaymentMode, effectiveStatus),
    { keepPreviousData: true }
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
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedTransactions(new Set());
  };

  const verifyTransactionMutation = useMutation(
    (transactionId: number) => apiClient.verifyTransaction(transactionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["fetchTransactions"]);
        setPendingVerifyId(null);
      },
      onError: (error: any) => {
        console.error("Error verifying transaction:", error);
        setPendingVerifyId(null);
      },
    }
  );

  const renderVerificationStatus = (transaction: TransactionType) => {
    if (transaction.isVerified) {
      return (
        <div className="flex items-center gap-1.5">
          <FaCheckCircle className="text-emerald-500 text-sm" />
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Verified
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <FaClock className="text-amber-500 text-sm" />
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          Pending
        </span>
      </div>
    );
  };

  const renderVerificationAction = (transaction: TransactionType) => {
    if (transaction.isVerified) {
      return (
        <span className="text-xs text-gray-400">
          by {transaction.verifiedBy}
        </span>
      );
    }

    if (userRole !== "SUPER_ADMIN") return null;

    const isVerifying = verifyTransactionMutation.isLoading && pendingVerifyId === transaction.id;

    if (pendingVerifyId === transaction.id) {
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-gray-600">Confirm?</span>
          <button
            onClick={() => verifyTransactionMutation.mutate(transaction.id)}
            disabled={isVerifying}
            className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isVerifying ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
            ) : (
              <FaCheck className="text-xs" />
            )}
            Yes
          </button>
          <button
            onClick={() => setPendingVerifyId(null)}
            className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            No
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setPendingVerifyId(transaction.id);
        }}
        className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
      >
        <FaCheck className="text-xs" />
        Verify
      </button>
    );
  };

  const statusTabs: { label: string; value: "all" | "verified" | "pending" }[] = [
    { label: "All", value: "all" },
    { label: "Verified", value: "verified" },
    { label: "Pending", value: "pending" },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to="/dashboard/inventory" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Inventory
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Transaction History</h2>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Status
            </span>
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === tab.value
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Payment
            </span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white min-w-[140px]"
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              {(!transactionData?.transactions || transactionData.transactions.length === 0) ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {paymentModeFilter === "all" && statusFilter === "all"
                    ? "No transactions found."
                    : "No transactions match the selected filters."}
                </div>
              ) : (
                <>
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sold By</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                        <th className="py-3 px-5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactionData.transactions.map((transaction: TransactionType) => (
                        <React.Fragment key={transaction.id}>
                          <tr
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => toggleTransactionExpansion(transaction.id)}
                          >
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.studentName}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-500">
                              {transaction.className} – {transaction.sectionName}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-500">
                              {transaction.modeOfPayment}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                              {transaction.soldBy}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ₹{transaction.totalAmount.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              {renderVerificationStatus(transaction)}
                            </td>
                            <td
                              className="py-3.5 px-5 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderVerificationAction(transaction)}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-gray-400 text-sm">
                              {expandedTransactions.has(transaction.id) ? (
                                <FaChevronUp />
                              ) : (
                                <FaChevronDown />
                              )}
                            </td>
                          </tr>
                          {expandedTransactions.has(transaction.id) && (
                            <tr>
                              <td colSpan={9} className="px-5 py-4 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                  Products Purchased
                                </p>
                                <div className="space-y-2">
                                  {transaction.transactionItems.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 px-4 bg-white rounded-lg border border-gray-200"
                                    >
                                      <span className="text-sm font-medium text-gray-900">
                                        {item.productName}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        {item.quantity} × ₹{item.unitPrice} ={" "}
                                        <span className="font-semibold text-gray-900">
                                          ₹{item.totalPrice.toFixed(2)}
                                        </span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                  <div>
                                    <span className="text-sm font-semibold text-gray-900">
                                      Total: ₹{transaction.totalAmount.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-400 ml-3">
                                      via {transaction.modeOfPayment}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {renderVerificationStatus(transaction)}
                                    {transaction.isVerified && transaction.verifiedBy && (
                                      <span className="text-xs text-gray-400">
                                        by {transaction.verifiedBy}
                                        {transaction.verifiedAt && ` on ${formatDate(transaction.verifiedAt)}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-right text-xs text-gray-400 mt-2">
                                  Transaction #{transaction.id}
                                </p>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* Pagination */}
            {transactionData?.pagination && transactionData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {transactionData.pagination.currentPage} of {transactionData.pagination.totalPages}
                  {" · "}
                  {transactionData.pagination.totalItems} transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: Math.min(5, transactionData.pagination.totalPages) },
                    (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > transactionData.pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? "bg-blue-600 text-white"
                              : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === transactionData.pagination.totalPages}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
