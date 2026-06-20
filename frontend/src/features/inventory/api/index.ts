import { AddProductFormData } from "../pages/Inventory";
import { ProductType } from "../../../api/type";

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export type ClassType = {
    id: number;
    name: string;
    schoolId: number;
    sections?: SectionType[];
}

export type SectionType = {
    id: number;
    name: string;
    classId: number;
    schoolId: number;
}

export type TransactionItemType = {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export type TransactionType = {
    id: number;
    studentName: string;
    className: string;
    sectionName: string;
    modeOfPayment: string;
    totalAmount: number;
    soldBy: string;
    userId: number;
    isVerified: boolean;
    verifiedBy: string | null;
    verifiedAt: string | null;
    createdAt: string;
    transactionItems: TransactionItemType[];
}

export type StockInType = {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    note: string | null;
    addedBy: string;
    createdAt: string;
}

export type StudentSearchResult = {
    id: number;
    name: string;
    fatherName: string | null;
    classId: number;
    sectionId: number;
    className: string;
    sectionName: string;
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

export const fetchProducts = async(includeOutOfStock?: boolean): Promise<ProductType[]> => {
    const params = new URLSearchParams();
    if (includeOutOfStock) {
        params.append("includeOutOfStock", "true");
    }
    const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
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

export const fetchRecentTransactions = async (): Promise<TransactionType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/recent`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error.message)
    }
    return body.data;
}

export const fetchTransactions = async (
    page: number = 1,
    limit: number = 20,
    paymentMode?: string,
    status?: "verified" | "pending"
) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (paymentMode) {
        params.append("paymentMode", paymentMode);
    }

    if (status) {
        params.append("status", status);
    }

    const response = await fetch(`${API_BASE_URL}/api/transactions?${params.toString()}`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error.message)
    }
    return body.data;
}

export const verifyTransaction = async (transactionId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}/verify`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        }
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.error?.message || body.message)
    }
    return body
}

export const stockInProduct = async (productId: number, quantity: number, note?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/products/stock-in`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity, note })
    })

    const body = await response.json()
    if (!body.success) {
        throw new Error(body.error?.message || body.message)
    }
    return body
}

export const searchStudents = async (q: string): Promise<StudentSearchResult[]> => {
    const params = new URLSearchParams({ q });
    const response = await fetch(`${API_BASE_URL}/api/students/search?${params.toString()}`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error?.message || body.message)
    }
    return body.data;
}

export const fetchStockIns = async (productId?: number): Promise<StockInType[]> => {
    const params = new URLSearchParams();
    if (productId) {
        params.append("productId", productId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/products/stock-in?${params.toString()}`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error?.message || body.message)
    }
    return body.data;
}
