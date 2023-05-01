import { IExpense } from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

export interface IExpenseEngine {
    getExpense(id: string): Promise<IExpense>;
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(expense: IExpense): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
}

export const IExpenseEngine = Symbol.for("IExpenseEngine");
