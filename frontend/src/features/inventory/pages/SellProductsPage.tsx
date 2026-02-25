import React, { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { MdOutlineDelete } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import { useAppContext } from "../../../providers/AppContext";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentSchool } from "../../../api/school";

interface Order {
    studentsName: string;
    classId: number;
    sectionId: number;
    modeOfPayment: string;
    products: {
            productId: number | undefined;
            qty: number | undefined;
        }[];
}

const SellProductsPage: React.FC = () => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);

    const { data: school } = useQuery('currentSchool', getCurrentSchool);
    const paymentModes = school?.paymentModes || ['Cash'];

    const {
        control,
        handleSubmit,
        register,
        formState: { errors },
        watch,
        setValue,
    } = useForm<Order>({
        defaultValues: {
            studentsName: "",
            classId: 0,
            sectionId: 0,
            modeOfPayment: "",
            products: [{ productId: undefined, qty: undefined }],
        },
    });
    const watchFields = watch("products");
    const watchClassId = watch("classId");
    const { fields, append, remove } = useFieldArray({
        name: "products",
        control,
    });

    const { data: classes } = useQuery("fetchClasses", apiClient.fetchClasses);
    const { data: products } = useQuery("fetchProducts", apiClient.fetchProducts);

    const availableSections = useMemo(() => {
        if (!classes || !watchClassId) return [];
        const selectedClass = classes.find(cls => cls.id === watchClassId);
        return selectedClass?.sections || [];
    }, [classes, watchClassId]);

    React.useEffect(() => {
        if (watchClassId !== selectedClassId) {
            setValue("sectionId", 0);
            setSelectedClassId(watchClassId);
        }
    }, [watchClassId, selectedClassId, setValue]);

    const mutation = useMutation(apiClient.sellProducts, {
        onSuccess: () => {
            showToast({ message: "Products sold successfully!", type: "SUCCESS" });
            queryClient.invalidateQueries("fetchProducts");
            navigate("/dashboard/inventory");
        },
        onError: (error: Error) => {
            showToast({ message: error.message, type: "ERROR" });
        },
    });

    const onSubmit = (data: Order) => {
        mutation.mutate(data);
    };

    const getUnitPrice = (id: number | undefined): number => {
        const p = products?.find((product) => product.id == id);
        return p?.price ?? 0;
    };

    const getLineTotal = (id: number | undefined, qty: number | undefined) => {
        return getUnitPrice(id) * (qty || 0);
    };

    const grandTotal = watchFields.reduce(
        (acc, f) => acc + getLineTotal(f.productId, f.qty),
        0
    );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link
                        to="/dashboard/inventory"
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Inventory
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900 mt-1">Sell Products</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Customer Details
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Student Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Student's Name
                                </label>
                                <input
                                    type="text"
                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.studentsName ? "border-red-300 bg-red-50" : "border-gray-200"
                                    }`}
                                    placeholder="Enter student name"
                                    {...register("studentsName", {
                                        required: "This field is required",
                                    })}
                                />
                                {errors.studentsName && (
                                    <p className="text-red-500 text-xs mt-1">{errors.studentsName.message}</p>
                                )}
                            </div>

                            {/* Mode of Payment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Mode of Payment
                                </label>
                                <select
                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.modeOfPayment ? "border-red-300 bg-red-50" : "border-gray-200"
                                    }`}
                                    {...register("modeOfPayment", { required: "This field is required" })}
                                >
                                    <option value="" disabled hidden>
                                        Select payment mode
                                    </option>
                                    {paymentModes.map((mode) => (
                                        <option key={mode} value={mode}>
                                            {mode}
                                        </option>
                                    ))}
                                </select>
                                {errors.modeOfPayment && (
                                    <p className="text-red-500 text-xs mt-1">{errors.modeOfPayment.message}</p>
                                )}
                            </div>

                            {/* Class */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Class
                                </label>
                                <select
                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.classId ? "border-red-300 bg-red-50" : "border-gray-200"
                                    }`}
                                    {...register("classId", {
                                        required: "This field is required",
                                        valueAsNumber: true,
                                        validate: (value) => value > 0 || "Please select a class",
                                    })}
                                >
                                    <option value={0} disabled>
                                        Select Class
                                    </option>
                                    {classes?.map((classItem) => (
                                        <option key={classItem.id} value={classItem.id}>
                                            {classItem.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.classId && (
                                    <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>
                                )}
                            </div>

                            {/* Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Section
                                </label>
                                <select
                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 ${
                                        errors.sectionId ? "border-red-300 bg-red-50" : "border-gray-200"
                                    }`}
                                    {...register("sectionId", {
                                        required: "This field is required",
                                        valueAsNumber: true,
                                        validate: (value) => value > 0 || "Please select a section",
                                    })}
                                    disabled={!watchClassId || availableSections.length === 0}
                                >
                                    <option value={0} disabled>
                                        {!watchClassId ? "Select class first" : "Select Section"}
                                    </option>
                                    {availableSections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.sectionId && (
                                    <p className="text-red-500 text-xs mt-1">{errors.sectionId.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Items
                        </p>

                        {/* Column headers */}
                        <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-1">
                            <span className="col-span-5 text-xs text-gray-400 font-medium">Product</span>
                            <span className="col-span-2 text-xs text-gray-400 font-medium">Unit Price</span>
                            <span className="col-span-2 text-xs text-gray-400 font-medium">Qty</span>
                            <span className="col-span-2 text-xs text-gray-400 font-medium">Subtotal</span>
                            <span className="col-span-1" />
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, index) => {
                                const unitPrice = getUnitPrice(watchFields[index]?.productId);
                                const lineTotal = getLineTotal(watchFields[index]?.productId, watchFields[index]?.qty);
                                return (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-center">
                                        <div className="col-span-12 md:col-span-5">
                                            <select
                                                {...register(`products.${index}.productId`, {
                                                    valueAsNumber: true,
                                                })}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="" disabled hidden>
                                                    Select a product
                                                </option>
                                                {products?.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                                                {unitPrice > 0 ? `₹${unitPrice}` : "—"}
                                            </div>
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <input
                                                type="number"
                                                min={1}
                                                placeholder="Qty"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                {...register(`products.${index}.qty`, {
                                                    valueAsNumber: true,
                                                })}
                                            />
                                        </div>
                                        <div className="col-span-3 md:col-span-2">
                                            <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700">
                                                {lineTotal > 0 ? `₹${lineTotal.toFixed(2)}` : "—"}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                disabled={fields.length < 2}
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                                            >
                                                <MdOutlineDelete size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
                            onClick={() => append({ productId: undefined, qty: undefined })}
                        >
                            <FaPlus className="text-xs" />
                            Add Item
                        </button>
                    </div>

                    {/* Summary & Submit */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 flex items-center gap-4">
                            <span className="text-sm font-medium text-blue-700">Grand Total</span>
                            <span className="text-2xl font-bold text-blue-700">₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={mutation.isLoading}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {mutation.isLoading && (
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {mutation.isLoading ? "Processing…" : "Place Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SellProductsPage;
