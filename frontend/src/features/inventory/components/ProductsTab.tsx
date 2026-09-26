import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api";
import { FaBoxOpen, FaExclamationTriangle, FaCubes, FaSearch } from "react-icons/fa";
import RecentTransactions from "./RecentTransactions";

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

const ProductsTab = () => {
  const [productSearch, setProductSearch] = useState("");

  const { data: products, isLoading } = useQuery(
    "fetchProducts",
    () => apiClient.fetchProducts()
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

  return (
    <div className="space-y-6">
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

      {/* Products */}
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

      <RecentTransactions />
    </div>
  );
};

export default ProductsTab;
