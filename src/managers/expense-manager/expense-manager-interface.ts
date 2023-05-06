import { IExpense, IExpenseUpdate } from "@splitsies/shared-models";

export interface IExpenseManager {
    getExpense(id: string): Promise<IExpense>;
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(expense: IExpense): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
    getExpensesForUser(userId: string): Promise<IExpense[]>;
}

export const IExpenseManager = Symbol.for("IExpenseManager");
