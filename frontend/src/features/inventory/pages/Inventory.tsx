import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { TransactionType } from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { FaPlus, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());

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
    return products.filter((product: any) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

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

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Inventory Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link
              to="/dashboard/sell-products"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200"
            >
              Sell Product
            </Link>
            {(userRole === 'SUPER_ADMIN' || userRole === null) && (
              <button
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
                onClick={() => setIsModalOpen(true)}
              >
                <FaPlus />
                Add Product
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Qty
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                        {product.qty}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                        ₹{product.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Transactions Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Recent Transactions</h3>
            <Link
              to="/dashboard/transaction-history"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Transactions →
            </Link>
          </div>

          {transactionsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
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
                    {recentTransactions?.map((transaction: TransactionType) => (
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
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-gray-800">Products Purchased:</h4>
                                  <span className="text-sm text-gray-600">
                                    Payment: {transaction.modeOfPayment}
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
                                <div className="text-right">
                                  <span className="text-sm text-gray-600">
                                    Transaction ID: #{transaction.id}
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
                {(!recentTransactions || recentTransactions.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No recent transactions found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Add New Product
            </h3>
            <form onSubmit={onSubmit}>
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product Name"
                  {...register("name", { required: "This field is required" })}
                />
                {errors.name && (
                  <span className="text-red-500">{errors.name.message}</span>
                )}
                <input
                  type="number"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quantity"
                  {...register("qty", {
                    required: "This field is required",
                    valueAsNumber: true,
                  })}
                />
                {errors.qty && (
                  <span className="text-red-500">{errors.qty.message}</span>
                )}
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Price"
                  {...register("price", {
                    required: "This field is required",
                    pattern: {
                      value: /^\d+(\.\d{1,2})?$/,
                      message: "Invalid price format",
                    },
                  })}
                />
                {errors.price && (
                  <span className="text-red-500">{errors.price.message}</span>
                )}
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Add Product
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
