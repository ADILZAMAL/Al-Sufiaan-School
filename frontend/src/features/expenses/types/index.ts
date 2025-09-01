export type ExpenseType = {
    id: number;
    name: string;
    amount: number;
    remarks: string;
    userId: number;
    schoolId: number;
    categoryId: number; // Now mandatory
    isVendorPayment: boolean; // Flag to identify vendor payment expenses
    isPayslipPayment: boolean; // Flag to identify payslip payment expenses
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
