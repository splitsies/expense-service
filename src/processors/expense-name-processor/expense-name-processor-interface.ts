import { IOcrResult } from "@splitsies/shared-models";

export interface IExpenseNameProcessor {
    process(ocrResult: IOcrResult): string;
}

export const IExpenseNameProcessor = Symbol.for("IExpenseNameProcessor");
