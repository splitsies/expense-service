import { IOcrResult, IExpenseItem } from "@splitsies/shared-models";

export interface IExpenseProportionalItemsProcessor {
    process(ocrResult: IOcrResult): IExpenseItem[];
}

export const IExpenseProportionalItemsProcessor = Symbol.for("IExpenseProportionalItemsProcessor");
