import {AddProductFormData} from '../features/inventory/pages/Inventory'
import { AddExpense, ExpenseType } from '../features/expenses/types';
const API_BASE_URL = import.meta.env.BACKEND_API_BASE_URL || "";
export type { ExpenseType, AddExpense };

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

export const fetchExpenses = async (name?: string, fromDate?: Date, toDate?: Date): Promise<ExpenseType[]> => {
    const params = new URLSearchParams();
    if (name) {
        params.append("name", name);
    }
    if (fromDate) {
        params.append("fromDate", fromDate.toISOString());
    }
    if (toDate) {
        params.append("toDate", toDate.toISOString());
    }
    const response = await fetch(`${API_BASE_URL}/api/expenses?${params.toString()}`, {
        credentials: "include"
    })
    const body = await response.json();
    if(!body.success) {
        throw new Error(body.error.message)
    }
    return body.data
}

export const addExpense = async (formData: AddExpense) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.message)
    }
    return body
}

export const fetchTotalExpenseForCurrentMonth = async (date?: Date): Promise<{ total: number }> => {
    const params = new URLSearchParams();
    if (date) {
        params.append("date", date.toISOString());
    }
    const response = await fetch(`${API_BASE_URL}/api/expenses/total-current-month?${params.toString()}`, {
        credentials: "include"
    })
    const body = await response.json();
    if(!body.success) {
        throw new Error(body.error.message)
    }
    return body.data
}
