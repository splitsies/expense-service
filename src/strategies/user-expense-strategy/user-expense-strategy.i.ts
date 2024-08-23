export interface IUserExpenseStrategy {
    addUserToExpense(userId: string, expenseId: string): Promise<void>;
}

export const IUserExpenseStrategy = Symbol.for("IUserExpenseStrategy");