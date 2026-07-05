import React, { useState, useMemo, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { StudentSearchResult } from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { getCurrentSchool } from "../../../api/school";
import { MdOutlineDelete } from "react-icons/md";
import { FaPlus, FaTimes } from "react-icons/fa";
import { ProductType } from "../../../api/type";

interface SellForm {
    studentId: number;
    classId: number;
    sectionId: number;
    modeOfPayment: string;
    referenceId?: string;
    products: { productId: number | undefined; qty: number | undefined }[];
}

interface Props {
    onClose: () => void;
}

const SellProductModal: React.FC<Props> = ({ onClose }) => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();

    const [studentQuery, setStudentQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const { data: school } = useQuery("currentSchool", getCurrentSchool);
    const paymentModes = school?.paymentModes || ["Cash"];

    const { data: products } = useQuery("fetchProducts", () => apiClient.fetchProducts());
    const { data: allStudents = [] } = useQuery("searchAllStudents", () => apiClient.searchStudents(""));

    const {
        control,
        handleSubmit,
        register,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm<SellForm>({
        defaultValues: {
            studentId: 0,
            classId: 0,
            sectionId: 0,
            modeOfPayment: "",
            products: [{ productId: 0, qty: undefined }],
        },
    });

    const watchFields = watch("products");
    const watchPaymentMode = watch("modeOfPayment");
    const { fields, append, remove } = useFieldArray({ name: "products", control });

    const mutation = useMutation(apiClient.sellProducts, {
        onSuccess: () => {
            showToast({ message: "Products sold successfully!", type: "SUCCESS" });
            queryClient.invalidateQueries("fetchProducts");
            queryClient.invalidateQueries("fetchRecentTransactions");
            reset();
            setStudentQuery("");
            setSelectedStudent(null);
            onClose();
        },
        onError: (error: Error) => {
            showToast({ message: error.message, type: "ERROR" });
        },
    });

    const suggestions = useMemo(() => {
        if (studentQuery.length < 2) return [];
        const q = studentQuery.toLowerCase();
        return allStudents.filter(s =>
            s.name.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [studentQuery, allStudents]);

    useEffect(() => { setActiveIndex(-1); }, [studentQuery]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.min(activeIndex + 1, suggestions.length - 1);
            setActiveIndex(next);
            itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = Math.max(activeIndex - 1, 0);
            setActiveIndex(prev);
            itemRefs.current[prev]?.scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0) selectStudent(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const selectStudent = (student: StudentSearchResult) => {
        setSelectedStudent(student);
        setStudentQuery(student.name);
        setShowSuggestions(false);
        setValue("studentId", student.id);
        setValue("classId", student.classId);
        setValue("sectionId", student.sectionId);
    };

    const clearStudent = () => {
        setSelectedStudent(null);
        setStudentQuery("");
        setValue("studentId", 0);
        setValue("classId", 0);
        setValue("sectionId", 0);
    };

    const getUnitPrice = (id: number | undefined): number => {
        const p = products?.find((product: ProductType) => product.id == id);
        return p?.price ?? 0;
    };

    const getLineTotal = (id: number | undefined, qty: number | undefined) =>
        getUnitPrice(id) * (qty || 0);

    const grandTotal = watchFields.reduce(
        (acc, f) => acc + getLineTotal(f.productId, f.qty),
        0
    );

    const onSubmit = (data: SellForm) => {
        mutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-semibold text-gray-900">Sell Products</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {/* Student Search */}
                    <div className="relative" ref={suggestionsRef}>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Student
                        </label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                autoFocus
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Type student name…"
                                value={studentQuery}
                                onChange={(e) => {
                                    setStudentQuery(e.target.value);
                                    setShowSuggestions(true);
                                    if (selectedStudent) clearStudent();
                                }}
                                onKeyDown={handleKeyDown}
                            />
                            {selectedStudent && (
                                <button
                                    type="button"
                                    onClick={clearStudent}
                                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes size={12} />
                                </button>
                            )}
                        </div>
                        {selectedStudent && (
                            <p className="text-xs text-emerald-600 mt-1 font-medium">
                                {selectedStudent.className} — {selectedStudent.sectionName}
                            </p>
                        )}
                        {!selectedStudent && errors.studentId && (
                            <p className="text-red-500 text-xs mt-1">{errors.studentId.message}</p>
                        )}

                        {/* Autocomplete dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-52">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={s.id}
                                        ref={el => { itemRefs.current[i] = el; }}
                                        type="button"
                                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${i === activeIndex ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                                        onMouseDown={() => selectStudent(s)}
                                        onMouseEnter={() => setActiveIndex(i)}
                                    >
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                                            {s.fatherName && (
                                                <span className="text-xs text-gray-400 ml-2">s/o {s.fatherName}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0 ml-4">{s.className} – {s.sectionName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showSuggestions && suggestions.length === 0 && studentQuery.length >= 2 && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
                                No students found
                            </div>
                        )}

                        {/* Hidden fields for form submission */}
                        <input type="hidden" {...register("studentId", { valueAsNumber: true, validate: v => v > 0 || "Select a student" })} />
                        <input type="hidden" {...register("classId", { valueAsNumber: true, validate: v => v > 0 || "Select a student" })} />
                        <input type="hidden" {...register("sectionId", { valueAsNumber: true, validate: v => v > 0 || "Select a student" })} />
                    </div>

                    {/* Mode of Payment */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Mode of Payment
                        </label>
                        <select
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.modeOfPayment ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            {...register("modeOfPayment", { required: "Required" })}
                        >
                            <option value="" disabled hidden>Select payment mode</option>
                            {paymentModes.map((mode: string) => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                        {errors.modeOfPayment && (
                            <p className="text-red-500 text-xs mt-1">{errors.modeOfPayment.message}</p>
                        )}
                    </div>

                    {/* Reference ID — shown for non-Cash payments */}
                    {watchPaymentMode && watchPaymentMode !== "Cash" && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                Reference ID
                            </label>
                            <input
                                type="text"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.referenceId ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                placeholder="Transaction / cheque / UPI reference"
                                {...register("referenceId", { required: "Reference ID is required for non-cash payments", shouldUnregister: true })}
                            />
                            {errors.referenceId && (
                                <p className="text-red-500 text-xs mt-1">{errors.referenceId.message}</p>
                            )}
                        </div>
                    )}

                    {/* Products */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Items
                        </label>
                        <div className="space-y-2">
                            {fields.map((field, index) => {
                                    const lineTotal = getLineTotal(watchFields[index]?.productId, watchFields[index]?.qty);
                                return (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <select
                                            {...register(`products.${index}.productId`, { valueAsNumber: true })}
                                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value={0} disabled>Select product</option>
                                            {products?.map((product: ProductType) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} (₹{product.price})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min={1}
                                            placeholder="Qty"
                                            className="w-20 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            {...register(`products.${index}.qty`, { valueAsNumber: true })}
                                        />
                                        <div className="w-20 text-sm font-semibold text-gray-700 text-right shrink-0">
                                            {lineTotal > 0 ? `₹${lineTotal.toFixed(0)}` : "—"}
                                        </div>
                                        <button
                                            type="button"
                                            disabled={fields.length < 2}
                                            onClick={() => remove(index)}
                                            className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors shrink-0"
                                        >
                                            <MdOutlineDelete size={20} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            onClick={() => append({ productId: 0, qty: undefined })}
                        >
                            <FaPlus className="text-xs" /> Add item
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-right">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total </span>
                            <span className="text-xl font-bold text-gray-900 ml-2">₹{grandTotal.toFixed(0)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isLoading}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {mutation.isLoading ? "Processing…" : "Place Order"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SellProductModal;
