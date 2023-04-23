import { IOcrResult } from "@splitsies/shared-models";

export interface IExpenseDateProcessor {
  process(ocrResult: IOcrResult): Date;
}

export const IExpenseDateProcessor = Symbol.for("IExpenseDateProcessor");
