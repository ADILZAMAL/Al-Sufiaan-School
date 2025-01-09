import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";
import * as apiClient from "../api-client";
import { useAppContext } from "../contexts/AppContext";
// import SellProducts from "../components/SellProducts";
// import { useNavigate } from "react-router-dom"

export type AddProductFormData = {
    name: string;
    buyPrice: string;
    price: string;
    qty: string;
};



const Inventory = () => {
    const { showToast } = useAppContext();
    //   const navigate = useNavigate();
    //   const queryClient = useQueryClient();

    //   const location = useLocation();

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<AddProductFormData>();

    const mutation = useMutation(apiClient.addProduct, {
        onSuccess: async () => {
            showToast({ message: "Product Added Successful!", type: "SUCCESS" });
            //   await queryClient.invalidateQueries("validateToken");
            //   navigate("/dashboard/class");
            window.location.reload();
        },
        onError: (error: Error) => {
            showToast({ message: error.message, type: "ERROR" });
        },
    });

    const onSubmit = handleSubmit((data) => {
        mutation.mutate(data);
    });

    return (
        <div>
            <div>
                <h2 className="text-3xl font-bold">Add Product</h2>
                <form className="flex gap-5" onSubmit={onSubmit}>
                    <label className="text-gray-700 text-sm font-bold flex-1">
                        Name
                        <input
                            type="text"
                            className="border rounded w-full py-1 px-2 font-normal"
                            {...register("name", { required: "This field is required" })}
                        ></input>
                        {errors.name && (
                            <span className="text-red-500">{errors.name.message}</span>
                        )}
                    </label>
                    <label className="text-gray-700 text-sm font-bold flex-1">
                        Buy Price
                        <input
                            type="text"
                            className="border rounded w-full py-1 px-2 font-normal"
                            {...register("buyPrice", {
                                required: "This field is required",
                                pattern: {
                                    value: /^\d+(\.\d{1,2})$/, // Pattern to match a decimal number with up to 2 decimal places
                                    message: "Invalid price format", // Error message if the pattern is not matched
                                },
                            })}
                        ></input>
                        {errors.buyPrice && (
                            <span className="text-red-500">{errors.buyPrice.message}</span>
                        )}
                    </label>
                    <label className="text-gray-700 text-sm font-bold flex-1">
                        Price
                        <input
                            type="text"
                            className="border rounded w-full py-1 px-2 font-normal"
                            {...register("price", {
                                required: "This field is required",
                                pattern: {
                                    value: /^\d+(\.\d{1,2})$/, // Pattern to match a decimal number with up to 2 decimal places
                                    message: "Invalid price format", // Error message if the pattern is not matched
                                },
                            })}
                        ></input>
                        {errors.price && (
                            <span className="text-red-500">{errors.price.message}</span>
                        )}
                    </label>
                    <label className="text-gray-700 text-sm font-bold flex-1">
                        Qty
                        <input
                            type="number"
                            className="border rounded w-full py-1 px-2 font-normal"
                            {...register("qty", {
                                required: "This field is required",
                                valueAsNumber: true
                            })}
                        ></input>
                        {errors.qty && (
                            <span className="text-red-500">{errors.qty.message}</span>
                        )}
                    </label>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white font-bold hover:bg-blue-500"
                    >
                        Add Product
                    </button>
                </form>
            </div>
            <div>
                <ProductList />
            </div>
            <div>
                {/* <SellProducts /> */}
            </div>
        </div>
    );
};


const ProductList = () => {
    const { data: products } = useQuery(
        "fetchProducts",
        apiClient.fetchProducts,
    )
    return (
        <>
            <div className="px-4 py-8 sm:px-8">
                <table className="border-collapse w-full border border-slate-400">
                    <caption className="caption-top font-semibold text-center text-slate-300">
                        Inventory
                    </caption>
                    <thead className="bg-slate-700">
                        <tr>
                            <th className="border border-slate-600 font-semibold p-1 text-slate-200 text-left">Name</th>
                            <th className="border border-slate-600 font-semibold p-1 text-slate-200 text-left">Available Qty</th>
                            <th className="border border-slate-600 font-semibold p-1 text-slate-200 text-left">Price</th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800">
                        {products?.map((product, index) => (
                            <tr key={index}>
                                <td className="border border-slate-700 p-1 text-slate-300">{product.name}</td>
                                <td className="border border-slate-700 p-1 text-slate-300">{product.qty}</td>
                                <td className="border border-slate-700 p-1 text-slate-300">{product.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}


export default Inventory;