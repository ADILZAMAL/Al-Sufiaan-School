import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { MdOutlineDelete } from "react-icons/md";
import { useAppContext } from "../../../providers/AppContext";
import { useNavigate } from "react-router-dom";

interface Order {
    studentsName: string;
    class: string;
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
    const {
        control,
        handleSubmit,
        register,
        formState: { errors },
        watch,
    } = useForm<Order>({
        defaultValues: {
            studentsName: "",
            class: "",
            modeOfPayment: "",
            products: [{ productId: undefined, qty: undefined }],
        },
    });
    const watchFields = watch("products");
    const { fields, append, remove } = useFieldArray({
        name: "products",
        control,
    });

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
    const { data: products } = useQuery("fetchProducts", apiClient.fetchProducts);

    const getPrice = (id: number | undefined, qty: number | undefined) => {
        const p = products?.filter((product) => product.id == id)[0];
        if (p === undefined) return 0;
        else return p.price * (qty || 0);
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Sell Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                        <input
                            type="text"
                            className="border rounded w-full py-2 px-3 font-normal"
                            {...register("class", { required: "This field is required" })}
                        />
                        {errors.class && (
                            <span className="text-red-500 text-xs">{errors.class.message}</span>
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
                            <option value="Cash">Cash</option>
                            <option value="Account - Sabinur">Account - Sabinur</option>
                            <option value="Account - Adil">Account - Adil</option>
                            <option value="Account - Sohail">Account - Sohail</option>
                            <option value="Account - Abdul Hannan">Account - Abdul Hannan</option>
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
                    <button type="submit" className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700">
                        Place Order
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SellProductsPage;
