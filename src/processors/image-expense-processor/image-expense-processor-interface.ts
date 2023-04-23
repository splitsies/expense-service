import { IExpense } from "../../services/expense-service";
import { IOcrResult } from "@splitsies/shared-models";

export interface IImageExpenseProcessor {
    process(ocrResult: IOcrResult): IExpense;
}

export const IImageExpenseProcessor: symbol = Symbol.for("IImageExpenseProcessor");
