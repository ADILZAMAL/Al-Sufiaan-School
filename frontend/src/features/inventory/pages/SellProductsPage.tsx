import React, { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { MdOutlineDelete } from "react-icons/md";
import { useAppContext } from "../../../providers/AppContext";
import { useNavigate } from "react-router-dom";
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
    
    // Fetch school data for payment modes
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

    // Fetch classes and products
    const { data: classes } = useQuery("fetchClasses", apiClient.fetchClasses);
    const { data: products } = useQuery("fetchProducts", apiClient.fetchProducts);

    // Get sections for selected class
    const availableSections = useMemo(() => {
        if (!classes || !watchClassId) return [];
        const selectedClass = classes.find(cls => cls.id === watchClassId);
        return selectedClass?.sections || [];
    }, [classes, watchClassId]);

    // Reset section when class changes
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

    const getPrice = (id: number | undefined, qty: number | undefined) => {
        const p = products?.filter((product) => product.id == id)[0];
        if (p === undefined) return 0;
        else return p.price * (qty || 0);
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Sell Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <label className="text-gray-700 text-sm font-bold">
                        Student's Name
                        <input
                            type="text"
                            className="border rounded w-full py-2 px-3 font-normal"
                            {...register("studentsName", {
                                required: "This field is required",
                            })}
                        />
                        {errors.studentsName && (
                            <span className="text-red-500 text-xs">
                                {errors.studentsName.message}
                            </span>
                        )}
                    </label>
                    <label className="text-gray-700 text-sm font-bold">
                        Class
                        <select
                            className="border rounded w-full py-2 px-3 font-normal"
                            {...register("classId", { 
                                required: "This field is required",
                                valueAsNumber: true,
                                validate: (value) => value > 0 || "Please select a class"
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
                            <span className="text-red-500 text-xs">{errors.classId.message}</span>
                        )}
                    </label>
                    <label className="text-gray-700 text-sm font-bold">
                        Section
                        <select
                            className="border rounded w-full py-2 px-3 font-normal"
                            {...register("sectionId", { 
                                required: "This field is required",
                                valueAsNumber: true,
                                validate: (value) => value > 0 || "Please select a section"
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
                            <span className="text-red-500 text-xs">{errors.sectionId.message}</span>
                        )}
                    </label>
                    <label className="text-gray-700 text-sm font-bold">
                        Mode of Payment
                        <select
                            className="border rounded w-full py-2 px-3 font-normal"
                            {...register("modeOfPayment", { required: "This field is required" })}
                        >
                            <option value="" disabled selected hidden>
                                Select Payment Mode
                            </option>
                            {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>
                                    {mode}
                                </option>
                            ))}
                        </select>
                        {errors.modeOfPayment && (
                            <span className="text-red-500 text-xs">{errors.modeOfPayment.message}</span>
                        )}
                    </label>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Products</h3>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <select
                                    {...register(`products.${index}.productId`, {
                                        valueAsNumber: true,
                                    })}
                                    className="border rounded w-full py-2 px-3"
                                >
                                    <option value="" disabled selected hidden>
                                        Select a product
                                    </option>
                                    {products?.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    className="border rounded w-full py-2 px-3"
                                    {...register(`products.${index}.qty`, {
                                        valueAsNumber: true,
                                    })}
                                />
                                <input
                                    type="text"
                                    disabled
                                    placeholder="Amount"
                                    className="border rounded w-full py-2 px-3 bg-gray-100"
                                    value={getPrice(
                                        watchFields[index]?.productId,
                                        watchFields[index]?.qty
                                    ).toFixed(2)}
                                />
                                <button
                                    disabled={fields.length < 2}
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                    <MdOutlineDelete size={24} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => append({ productId: undefined, qty: undefined })}
                    >
                        Add Product
                    </button>
                </div>

                <div className="flex justify-end items-center mb-6">
                    <div className="text-xl font-bold text-gray-800">
                        Grand Total: ₹
                        {watchFields.reduce((acc, f) => acc + getPrice(f.productId, f.qty), 0).toFixed(2)}
                    </div>
                </div>

                <div className="text-right">
                    <button 
                        type="submit" 
                        disabled={mutation.isLoading}
                        className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {mutation.isLoading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {mutation.isLoading ? "Processing..." : "Place Order"}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SellProductsPage;
