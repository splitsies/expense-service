import { IOcrResult, IExpense } from "@splitsies/shared-models";

export interface IExpenseEngine {
    createExpense(): IExpense;
    createExpenseFromImage(ocrResult: IOcrResult): IExpense;
    updateExpense(id: string, updated: Omit<IExpense, "id">): IExpense;
}

export const IExpenseEngine = Symbol.for("IExpenseEngine");
