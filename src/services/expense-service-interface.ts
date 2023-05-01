import { IExpense } from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

export interface IExpenseService {
    getExpense(id: string): Promise<IExpense>;
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(base64Image: string): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
}

export const IExpenseService: symbol = Symbol.for("IExpenseService");
