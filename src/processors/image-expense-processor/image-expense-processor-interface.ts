import { IOcrResult, IExpense } from "@splitsies/shared-models";

export interface IImageExpenseProcessor {
    process(ocrResult: IOcrResult): IExpense;
}

export const IImageExpenseProcessor: symbol = Symbol.for("IImageExpenseProcessor");
