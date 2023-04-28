import { IExpense } from "./expense-service";

export interface IExpenseService {
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(base64Image: string): Promise<IExpense>;
    updateExpense(id: string, updated: Omit<IExpense, "id">): Promise<IExpense>;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
