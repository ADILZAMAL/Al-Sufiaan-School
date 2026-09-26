import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaClock } from "react-icons/fa";
import TransactionItemsList from "./TransactionItemsList";
import { formatDate } from "../utils";

const RecentTransactions = () => {
  const { showToast, userRole } = useAppContext();
  const queryClient = useQueryClient();
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery(
    "fetchRecentTransactions",
    apiClient.fetchRecentTransactions
  );

  const verifyMutation = useMutation(apiClient.verifyTransaction, {
    onSuccess: () => {
      showToast({ message: "Transaction verified successfully!", type: "SUCCESS" });
      queryClient.invalidateQueries("fetchRecentTransactions");
      queryClient.invalidateQueries("fetchTransactions");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const toggleTransactionExpansion = (transactionId: number) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-lg mb-4">Recent Transactions</h3>

      {transactionsLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {(!recentTransactions || recentTransactions.length === 0) ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No recent transactions found.
            </div>
          ) : (
            <>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-5" />
                    <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider sticky right-0 bg-white z-10 border-l border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.map((transaction: TransactionType) => (
                    <React.Fragment key={transaction.id}>
                      <tr
                        className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => toggleTransactionExpansion(transaction.id)}
                      >
                        <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{transaction.studentName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {transaction.className} – {transaction.sectionName}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                          {transaction.modeOfPayment}
                          {transaction.referenceId && (
                            <div className="text-xs text-gray-400">Ref: {transaction.referenceId}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{transaction.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-gray-400 text-sm">
                          {expandedTransactions.has(transaction.id) ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </td>
                        <td
                          className="py-3.5 px-5 whitespace-nowrap sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-gray-100 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {transaction.isVerified ? (
                            <div className="flex items-center gap-1.5">
                              <FaCheckCircle className="text-emerald-500 text-sm" />
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                Verified
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <FaClock className="text-amber-500 text-sm" />
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  Pending
                                </span>
                              </div>
                              {userRole === "SUPER_ADMIN" && (
                                <button
                                  onClick={() => verifyMutation.mutate(transaction.id)}
                                  className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                  disabled={verifyMutation.isLoading}
                                >
                                  {verifyMutation.isLoading ? "…" : "Verify"}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedTransactions.has(transaction.id) && (
                        <tr>
                          <td colSpan={6} className="px-5 py-4 bg-gray-50">
                            <p className="text-xs text-gray-500 mb-3">
                              Sold by <span className="font-medium text-gray-700">{transaction.soldBy}</span>
                            </p>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                              Products Purchased
                            </p>
                            <TransactionItemsList items={transaction.transactionItems} />
                            <p className="text-right text-xs text-gray-400 mt-3">
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
      )}
    </div>
  );
};

export default RecentTransactions;
