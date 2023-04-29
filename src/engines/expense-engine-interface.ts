import { IOcrResult, IExpense } from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

export interface IExpenseEngine {
    createExpense(): Promise<IExpense>;
    createExpenseFromImage(ocrResult: IOcrResult): Promise<IExpense>;
    updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense>;
}

export const IExpenseEngine = Symbol.for("IExpenseEngine");
