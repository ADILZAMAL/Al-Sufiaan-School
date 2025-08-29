import { AddExpense, ExpenseType } from '../features/expenses/types';
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
export type { ExpenseType, AddExpense };

export type ClassType = {
    id: number;
    name: string;
    schoolId: number;
}

export type ExpenseCategoryType = {
    id: number;
    name: string;
    schoolId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type AddExpenseCategory = {
    name: string;
}

export type UpdateExpenseCategory = {
    name?: string;
    isActive?: boolean;
}

export const updateExpense = async (id: number, formData: AddExpense) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: 'PUT',
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

export const deleteExpense = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.message)
    }
    return body
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

// Expense Category API functions
export const fetchExpenseCategories = async (includeInactive?: boolean): Promise<ExpenseCategoryType[]> => {
    const params = new URLSearchParams();
    if (includeInactive) {
        params.append("includeInactive", "true");
    }
    const response = await fetch(`${API_BASE_URL}/api/expense-categories?${params.toString()}`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.message)
    }
    return body.data;
}

export const addExpenseCategory = async (formData: AddExpenseCategory) => {
    const response = await fetch(`${API_BASE_URL}/api/expense-categories`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if (!body.success) {
        throw new Error(body.message)
    }
    return body.data
}

export const updateExpenseCategory = async (id: number, formData: UpdateExpenseCategory) => {
    const response = await fetch(`${API_BASE_URL}/api/expense-categories/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if (!body.success) {
        throw new Error(body.message)
    }
    return body.data
}

export const deleteExpenseCategory = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/expense-categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    })

    const body = await response.json()
    if (!body.success) {
        throw new Error(body.message)
    }
    return body
}

export const fetchExpenseCategoryById = async (id: number): Promise<ExpenseCategoryType> => {
    const response = await fetch(`${API_BASE_URL}/api/expense-categories/${id}`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.message)
    }
    return body.data;
}
