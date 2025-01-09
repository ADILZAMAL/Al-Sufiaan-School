// import React from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { useQuery } from "react-query";
// import * as apiClient from "../api-client";
// import { MdOutlineDelete } from "react-icons/md";

// interface Order {
//     studentsName: string;
//     parentsName: string;
//     class: string;
//     section: string;
//     discount: number
//     modeOfPayment: string;
//     products: [
//         {
//             productId: number | undefined;
//             qty: number | undefined;
//         }
//     ];
// }

// const SellProducts: React.FC = () => {
//     const {
//         control,
//         handleSubmit,
//         register,
//         formState: { errors },
//         watch,
//     } = useForm<Order>({
//         defaultValues: {
//             studentsName: "",
//             parentsName: "",
//             class: "",
//             section: "",
//             discount: 0,
//             modeOfPayment: "",
//             products: [{ productId: undefined, qty: undefined }],
//         },
//     });
//     const watchFields = watch("products");
//     const watchDiscount = watch("discount")
//     const { fields, append, remove } = useFieldArray({
//         name: "products",
//         control,
//     });
//     const onSubmit = (data: Order) => {
//         console.log(data);
//     };
//     const { data: products } = useQuery("fetchProducts", apiClient.fetchProducts);

//     const getPrice = (id: number | undefined, qty: number | undefined) => {
//         const p = products?.filter((product) => product.id == id)[0];
//         if (p === undefined) return 0;
//         else return p.price * (qty || 0);
//     };
//     return (
//         <form onSubmit={handleSubmit(onSubmit)}>
//             <div>
//                 <div className="grid grid-cols-4 gap-10">
//                     <label className="text-gray-700 text-sm font-bold">
//                         Student's Name
//                         <input
//                             type="text"
//                             className="border rounded w-full py-1 px-2 font-normal"
//                             {...register("studentsName", {
//                                 required: "This field is required",
//                             })}
//                         ></input>
//                         {errors.studentsName && (
//                             <span className="text-red-500">
//                                 {errors.studentsName.message}
//                             </span>
//                         )}
//                     </label>
//                     <label className="text-gray-700 text-sm font-bold">
//                         Parent's Name
//                         <input
//                             type="text"
//                             className="border rounded w-full py-1 px-2 font-normal"
//                             {...register("parentsName", {
//                                 required: "This field is required",
//                             })}
//                         ></input>
//                         {errors.parentsName && (
//                             <span className="text-red-500">{errors.parentsName.message}</span>
//                         )}
//                     </label>
//                     <label className="text-gray-700 text-sm font-bold">
//                         Class
//                         <input
//                             type="text"
//                             className="border rounded w-full py-1 px-2 font-normal"
//                             {...register("class", { required: "This field is required" })}
//                         ></input>
//                         {errors.class && (
//                             <span className="text-red-500">{errors.class.message}</span>
//                         )}
//                     </label>
//                     <label className="text-gray-700 text-sm font-bold">
//                         Section
//                         <input
//                             type="text"
//                             className="border rounded w-full py-1 px-2 font-normal"
//                             {...register("section", { required: "This field is required" })}
//                         ></input>
//                         {errors.section && (
//                             <span className="text-red-500">{errors.section.message}</span>
//                         )}
//                     </label>
//                 </div>
//                 <div className="flex-col items-center justify-center">
//                     {fields.map((_, index) => {
//                         return (
//                             <div key={index} className="grid grid-cols-4 gap-10">
//                                 <label className="text-gray-700 text-sm font-bold">
//                                     Product
//                                     <select
//                                         // className="border rounded w-full py-1 px-2 font-normal"
//                                         {...register(`products.${index}.productId`, {
//                                             valueAsNumber: true,
//                                         })}
//                                     >
//                                         <option value="" disabled selected hidden>
//                                             Select an product
//                                         </option>
//                                         {products?.map((product) => {
//                                             return (
//                                                 <option key={product.id} value={product.id}>
//                                                     {product.name}
//                                                 </option>
//                                             );
//                                         })}
//                                     </select>
//                                 </label>
//                                 <label className="text-gray-700 text-sm font-bold">
//                                     Qty
//                                     <input
//                                         type="number"
//                                         className="border rounded w-full py-1 px-2 font-normal"
//                                         {...register(`products.${index}.qty`, {
//                                             valueAsNumber: true,
//                                         })}
//                                     />
//                                 </label>
//                                 <label className="text-gray-700 text-sm font-bold">
//                                     Amount
//                                     <input
//                                         type="text"
//                                         disabled
//                                         className="border rounded w-full py-1 px-2 font-normal"
//                                         value={getPrice(
//                                             watchFields[index].productId,
//                                             watchFields[index].qty
//                                         ).toFixed(2)}
//                                     />
//                                 </label>
//                                 <button
//                                     disabled={fields.length < 2}
//                                     type="button"
//                                     onClick={() => remove(index)}
//                                     className="text-3xl text-red-500"
//                                 >
//                                     <MdOutlineDelete />
//                                 </button>
//                             </div>
//                         );
//                     })}
//                     <hr className="border-2 border-gray-300 my-2" />
//                     <div className="flex justify-between px-5">
//                         <label className="text-gray-700 text-sm font-bold">
//                             Discount
//                         </label>
//                         <input
//                             type="number"
//                             className="border rounded py-1 px-2 font-normal"
//                             {...register("discount", {
//                                 valueAsNumber: true,
//                             })}
//                         />
//                     </div>
//                     <hr className="border-2 border-gray-300 my-2" />
//                     <hr className="border-2 border-gray-300 my-2" />
//                     <div className="flex justify-between px-5">
//                         <h1>Grand Total</h1>
//                         {watchFields.reduce((acc:any, f) => acc + getPrice(f.productId, f.qty), 0).toFixed(2) - watchDiscount}
//                     </div>
//                     <hr className="border-2 border-gray-300 my-2" />
//                     <div className="flex gap-3 flex-col items-center">
//                         <button
//                             type="button"
//                             className="inline-block rounded border-2 border-primary px-6 pb-[6px] pt-2 text-xs font-medium uppercase leading-normal text-primary transition duration-150 ease-in-out hover:border-primary-accent-300 hover:bg-primary-50/50 hover:text-primary-accent-300 focus:border-primary-600 focus:bg-primary-50/50 focus:text-primary-600 focus:outline-none focus:ring-0 active:border-primary-700 active:text-primary-700 motion-reduce:transition-none dark:text-primary-500 dark:hover:bg-blue-950 dark:focus:bg-blue-950"
//                             data-twe-ripple-init
//                             onClick={() => append({ productId: undefined, qty: undefined })}
//                         >
//                             Add Product
//                         </button>
//                         <hr />
//                         <select
//                             className="border rounded py-1 px-2 font-normal"
//                             {...register("modeOfPayment")}
//                         >
//                             <option value="" disabled selected hidden>
//                                 Select an payment Mode
//                             </option>
//                             <option value="UPI">UPI</option>
//                             <option value="CASH">CASH</option>
//                         </select>
//                     </div>
//                 </div>
//             </div>
//             <div className="text-center py-5">
//                 <button className="inline-block rounded bg-success px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-success-3 transition duration-150 ease-in-out hover:bg-success-accent-300 hover:shadow-success-2 focus:bg-success-accent-300 focus:shadow-success-2 focus:outline-none focus:ring-0 active:bg-success-600 active:shadow-success-2 motion-reduce:transition-none dark:shadow-black/30 dark:hover:shadow-dark-strong dark:focus:shadow-dark-strong dark:active:shadow-dark-strong" type="submit">Place order</button>
//             </div>
//         </form>
//     );
// };

// export default SellProducts;
