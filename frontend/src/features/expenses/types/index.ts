export type ExpenseType = {
    id: number;
    name: string;
    amount: number;
    remarks: string;
    userId: number;
    schoolId: number;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        firstName: string;
        lastName: string;
    }
}

export type AddExpense = {
    name: string;
    amount: string;
    category: string;
}
