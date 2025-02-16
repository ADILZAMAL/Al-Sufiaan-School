import { SignInFormData } from './pages/SignIn'
import {AddProductFormData} from './pages/Inventory'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type ClassType = {
    id: number;
    name: string;
    schoolId: number;
}

export type ProductType = {
    id: number;
    name: string;
    description: string;
    price: number;
    qty: number;
    schoolId: number;
    buyPrice: number;
    createdAt : Date;
    updatedAt : Date;
}

export const signIn = async (formData: SignInFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });

    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.message);
    }
    return body;
};

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
    if(!response.ok) {
        throw new Error(body.error.message)
    }
    return body
}

export const fetchProducts = async(): Promise<ProductType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "GET",
        credentials: "include"
    })
    const body = await response.json()
    if(!response.ok) {
        throw new Error(body.error.message)
    }
    return body.data
}

export const validateToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Token invalid");
    }

    return response.json();
};

export const fetchClasses = async (): Promise<ClassType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error.message)
    }
    return body.data;
}