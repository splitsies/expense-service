import { IExpense, IExpenseUpdate } from "@splitsies/shared-models";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IExpenseManager {
    getUserExpense(userId: string, expenseId: string): Promise<IUserExpense>;
    getExpense(id: string): Promise<IExpense>;
    createExpense(userId: string): Promise<IExpense>;
    createExpenseFromImage(expense: IExpense, userId: string): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
    getExpensesForUser(userId: string): Promise<IExpense[]>;
    addUserToExpense(userExpense: IUserExpense, requestingUserId: string): Promise<void>;
    addItemToExpense(
        name: string,
        price: number,
        owners: string[],
        isProportional: boolean,
        expenseId: string,
    ): Promise<IExpense>;
}

export const IExpenseManager = Symbol.for("IExpenseManager");
