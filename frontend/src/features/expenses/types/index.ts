export type ExpenseType = {
    id: number;
    name: string;
    amount: number;
    remarks: string;
    userId: number;
    schoolId: number;
    categoryId: number; // Now mandatory
    createdAt: Date;
    updatedAt: Date;
    user: {
        firstName: string;
        lastName: string;
    };
    expenseCategory: {
        id: number;
        name: string;
    };
}

export type AddExpense = {
    name: string;
    amount: string;
    categoryId: number; // Now mandatory
}
