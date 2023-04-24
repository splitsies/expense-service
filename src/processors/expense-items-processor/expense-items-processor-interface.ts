import { IOcrResult, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";

export interface IExpenseItemsProcessor {
    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[];
}

export const IExpenseItemsProcessor = Symbol.for("IExpenseItemsProcessor");
