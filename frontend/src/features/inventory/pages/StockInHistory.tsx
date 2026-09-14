import { useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api";
import { StockInType } from "../api";
import { Link } from "react-router-dom";
import { formatDate } from "../utils";

const StockInHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: stockInData, isLoading } = useQuery(
    ["fetchStockIns", currentPage],
    () => apiClient.fetchStockIns(currentPage, 20),
    { keepPreviousData: true }
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to="/dashboard/inventory" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Inventory
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Stock-In History</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              {(!stockInData?.stockIns || stockInData.stockIns.length === 0) ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No stock-in records yet.
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Note</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Added By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockInData.stockIns.map((si: StockInType) => (
                      <tr key={si.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(si.createdAt)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-sm font-medium text-gray-900">
                          {si.productName}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            +{si.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-gray-500 max-w-xs truncate">
                          {si.note || "—"}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                          {si.addedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {stockInData?.pagination && stockInData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {stockInData.pagination.currentPage} of {stockInData.pagination.totalPages}
                  {" · "}
                  {stockInData.pagination.totalItems} stock-ins
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
                    { length: Math.min(5, stockInData.pagination.totalPages) },
                    (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > stockInData.pagination.totalPages) return null;
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
                    disabled={currentPage === stockInData.pagination.totalPages}
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

export default StockInHistory;
