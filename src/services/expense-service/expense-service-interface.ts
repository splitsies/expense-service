import { IExpense, IExpenseUpdate } from "@splitsies/shared-models";

export interface IExpenseService {
    getExpense(id: string): Promise<IExpense>;
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(base64Image: string): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
    getExpensesForUser(userId: string): Promise<IExpense[]>;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
