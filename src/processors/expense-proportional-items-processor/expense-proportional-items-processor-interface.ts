import { IExpenseItem } from "../../services/expense-service";
import { IOcrResult } from "@splitsies/shared-models";

export interface IExpenseProportionalItemsProcessor {
  process(ocrResult: IOcrResult): IExpenseItem[];
}

export const IExpenseProportionalItemsProcessor = Symbol.for(
  "IExpenseProportionalItemsProcessor"
);
