import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { useAppContext } from "../../../providers/AppContext";
import {
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaBoxOpen,
  FaExclamationTriangle,
  FaCubes,
  FaCheckCircle,
  FaClock,
  FaSearch,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export type AddProductFormData = {
  name: string;
  qty: number;
  price: string;
};

const Inventory = () => {
  const { showToast, userRole } = useAppContext();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [productSearch, setProductSearch] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddProductFormData>();

  const mutation = useMutation(apiClient.addProduct, {
    onSuccess: () => {
      showToast({ message: "Product Added Successfully!", type: "SUCCESS" });
      reset();
      setIsModalOpen(false);
      queryClient.invalidateQueries("fetchProducts");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const verifyMutation = useMutation(apiClient.verifyTransaction, {
    onSuccess: () => {
      showToast({ message: "Transaction verified successfully!", type: "SUCCESS" });
      queryClient.invalidateQueries("fetchRecentTransactions");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  const { data: products, isLoading } = useQuery(
    "fetchProducts",
    apiClient.fetchProducts
  );

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery(
    "fetchRecentTransactions",
    apiClient.fetchRecentTransactions
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, lowStock: 0, totalUnits: 0 };
    return {
      total: products.length,
      lowStock: products.filter((p) => p.qty <= 5).length,
      totalUnits: products.reduce((acc, p) => acc + p.qty, 0),
    };
  }, [products]);

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

  const getQtyBadge = (qty: number) => {
    if (qty <= 2)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {qty} left
        </span>
      );
    if (qty <= 5)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          {qty} left
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        {qty} in stock
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/sell-products"
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Sell Product
            </Link>
            {(userRole === "SUPER_ADMIN" || userRole === null) && (
              <button
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <FaPlus className="text-xs" />
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FaBoxOpen className="text-blue-600 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{isLoading ? "—" : stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <FaExclamationTriangle className="text-red-600 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Low Stock</p>
              <p className="text-xl font-bold text-gray-900">{isLoading ? "—" : stats.lowStock}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FaCubes className="text-purple-600 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Units</p>
              <p className="text-xl font-bold text-gray-900">{isLoading ? "—" : stats.totalUnits}</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Products</h3>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {productSearch ? "No products match your search." : "No products found."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">{product.name}</span>
                  <div className="flex items-center gap-4">
                    {getQtyBadge(product.qty)}
                    <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                      ₹{product.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">Recent Transactions</h3>
            <Link
              to="/dashboard/transaction-history"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>

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
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sold By</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentTransactions.map((transaction: TransactionType) => (
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
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                              {transaction.soldBy}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm text-gray-600">
                              {transaction.modeOfPayment}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ₹{transaction.totalAmount.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        verifyMutation.mutate(transaction.id);
                                      }}
                                      className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                      disabled={verifyMutation.isLoading}
                                    >
                                      {verifyMutation.isLoading ? "…" : "Verify"}
                                    </button>
                                  )}
                                </div>
                              )}
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
                              <td colSpan={8} className="px-5 py-4 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                  Products Purchased
                                </p>
                                <div className="space-y-2">
                                  {transaction.transactionItems.map((item, idx) => (
                                    <div
                                      key={idx}
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
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
              <button
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={onSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="e.g. Notebook"
                    {...register("name", { required: "This field is required" })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.qty ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="e.g. 100"
                    {...register("qty", {
                      required: "This field is required",
                      valueAsNumber: true,
                    })}
                  />
                  {errors.qty && (
                    <p className="text-red-500 text-xs mt-1">{errors.qty.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.price ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="e.g. 25.00"
                    {...register("price", {
                      required: "This field is required",
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: "Invalid price format",
                      },
                    })}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  onClick={() => { setIsModalOpen(false); reset(); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isLoading ? "Adding…" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
