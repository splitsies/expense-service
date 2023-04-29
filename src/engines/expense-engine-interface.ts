import { IOcrResult, IExpense } from "@splitsies/shared-models";

export interface IExpenseEngine {
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(ocrResult: IOcrResult): Promise<IExpense>;
    updateExpense(id: string, updated: Omit<IExpense, "id" | "subtotal" | "total">): Promise<IExpense>;
}

export const IExpenseEngine = Symbol.for("IExpenseEngine");
