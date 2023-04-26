import { IOcrResult, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";

export interface IExpenseProportionalItemsProcessor {
    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[];
}

export const IExpenseProportionalItemsProcessor = Symbol.for("IExpenseProportionalItemsProcessor");
