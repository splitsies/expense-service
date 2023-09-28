import { IExpense, IExpenseUpdate } from "@splitsies/shared-models";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseManager {
    getExpense(id: string): Promise<IExpense>;
    createExpense(userId: string): Promise<IExpense>;
    createExpenseFromImage(expense: IExpense, userId: string): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
    getExpensesForUser(userId: string): Promise<IExpense[]>;
    addUserToExpense(userExpense: IUserExpense): Promise<void>;
}

export const IExpenseManager = Symbol.for("IExpenseManager");
