import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const TransactionHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactionData, isLoading } = useQuery(
    ["fetchTransactions", currentPage],
    () => apiClient.fetchTransactions(currentPage, 20),
    {
      keepPreviousData: true,
    }
  );

  const filteredTransactions = useMemo(() => {
    if (!transactionData?.transactions) return [];
    return transactionData.transactions.filter((transaction: TransactionType) =>
      transaction.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactionData?.transactions, searchTerm]);

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
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction: TransactionType) => (
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
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
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
                                  <span className="text-sm font-medium text-gray-800">
                                    Total Amount: ₹{transaction.totalAmount.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Payment: {transaction.modeOfPayment}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No transactions found matching your search." : "No transactions found."}
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
