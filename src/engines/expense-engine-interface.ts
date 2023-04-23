import { IOcrResult } from "@splitsies/shared-models";
import { IExpense } from "../services/expense-service";

export interface IExpenseEngine {
    createExpense(): IExpense;
    createExpenseFromImage(ocrResult: IOcrResult): IExpense;
    updateExpense(id: string, updated: Omit<IExpense, "id">): IExpense;
}

export const IExpenseEngine = Symbol.for("IExpenseEngine");
