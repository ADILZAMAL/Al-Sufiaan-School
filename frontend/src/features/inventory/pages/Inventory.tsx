import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router-dom";
import * as apiClient from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { FaPlus, FaTimes, FaArrowUp } from "react-icons/fa";
import SellProductModal from "../components/SellProductModal";
import ProductsTab from "../components/ProductsTab";
import SalesTab from "../components/SalesTab";
import StockInTab from "../components/StockInTab";

type InventoryTab = "products" | "sales" | "stock-in";

const TABS: { key: InventoryTab; label: string }[] = [
  { key: "products", label: "Products" },
  { key: "sales", label: "Sales" },
  { key: "stock-in", label: "Stock In" },
];

export type AddProductFormData = {
  name: string;
  qty: number;
  price: string;
};

export type StockInFormData = {
  productId: number;
  quantity: number;
  note?: string;
};

const Inventory = () => {
  const { showToast, userRole } = useAppContext();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: InventoryTab = TABS.some((t) => t.key === searchParams.get("tab"))
    ? (searchParams.get("tab") as InventoryTab)
    : "products";

  const setActiveTab = (tab: InventoryTab) =>
    setSearchParams((p) => { p.set("tab", tab); return p; }, { replace: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddProductFormData>();

  const {
    register: registerStockIn,
    handleSubmit: handleStockInSubmit,
    formState: { errors: stockInErrors },
    reset: resetStockIn,
  } = useForm<StockInFormData>();

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

  const stockInMutation = useMutation(
    (data: { productId: number; quantity: number; note?: string }) =>
      apiClient.stockInProduct(data.productId, data.quantity, data.note),
    {
      onSuccess: () => {
        showToast({ message: "Stock added successfully!", type: "SUCCESS" });
        resetStockIn();
        setIsStockInModalOpen(false);
        queryClient.invalidateQueries("fetchProducts");
        queryClient.invalidateQueries("fetchAllProducts");
        queryClient.invalidateQueries("fetchStockIns");
      },
      onError: (error: Error) => {
        showToast({ message: error.message, type: "ERROR" });
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  const onStockInSubmit = handleStockInSubmit((data) => {
    stockInMutation.mutate({
      productId: data.productId,
      quantity: data.quantity,
      note: data.note,
    });
  });

  const { data: allProducts } = useQuery(
    "fetchAllProducts",
    () => apiClient.fetchProducts(true)
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSellModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Sell Product
            </button>
            {(userRole === "SUPER_ADMIN" || userRole === null) && (
              <>
                <button
                  className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                  onClick={() => setIsStockInModalOpen(true)}
                >
                  <FaArrowUp className="text-xs" />
                  Stock In
                </button>
                <button
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => setIsModalOpen(true)}
                >
                  <FaPlus className="text-xs" />
                  Add Product
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "products" && <ProductsTab />}
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "stock-in" && <StockInTab />}
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

      {/* Sell Product Modal */}
      {isSellModalOpen && (
        <SellProductModal onClose={() => setIsSellModalOpen(false)} />
      )}

      {/* Stock In Modal */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Stock</h3>
              <button
                onClick={() => { setIsStockInModalOpen(false); resetStockIn(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={onStockInSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Product
                  </label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white ${
                      stockInErrors.productId ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                    {...registerStockIn("productId", { required: "Please select a product", valueAsNumber: true })}
                  >
                    <option value="">Select a product...</option>
                    {allProducts?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.qty} in stock)
                      </option>
                    ))}
                  </select>
                  {stockInErrors.productId && (
                    <p className="text-red-500 text-xs mt-1">{stockInErrors.productId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      stockInErrors.quantity ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                    placeholder="e.g. 50"
                    {...registerStockIn("quantity", {
                      required: "This field is required",
                      valueAsNumber: true,
                      min: { value: 1, message: "Must be at least 1" },
                    })}
                  />
                  {stockInErrors.quantity && (
                    <p className="text-red-500 text-xs mt-1">{stockInErrors.quantity.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Note <span className="text-gray-300 font-normal lowercase normal-case">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    placeholder="e.g. Restocked from supplier"
                    {...registerStockIn("note")}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  onClick={() => { setIsStockInModalOpen(false); resetStockIn(); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockInMutation.isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stockInMutation.isLoading ? "Adding…" : "Add Stock"}
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
