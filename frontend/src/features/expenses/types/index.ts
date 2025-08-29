export type ExpenseType = {
    id: number;
    name: string;
    amount: number;
    remarks: string;
    userId: number;
    schoolId: number;
    category: string | null; // For backward compatibility
    categoryId: number | null; // For new dynamic categories
    createdAt: Date;
    updatedAt: Date;
    user: {
        firstName: string;
        lastName: string;
    };
    expenseCategory?: {
        id: number;
        name: string;
    } | null;
}

export type AddExpense = {
    name: string;
    amount: string;
    category?: string; // For backward compatibility
    categoryId?: number; // For new dynamic categories
}
