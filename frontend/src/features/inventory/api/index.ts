import { AddProductFormData } from "../pages/Inventory";
import { ProductType } from "../../../api/type";

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export const addProduct = async (formData: AddProductFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.message)
    }
    return body
}

export const fetchProducts = async(): Promise<ProductType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "GET",
        credentials: "include"
    })
    const body = await response.json()
    if(!body.success) {
        throw new Error(body.message)
    }
    return body.data
}

export const sellProducts = async (formData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.message)
    }
    return body
}
