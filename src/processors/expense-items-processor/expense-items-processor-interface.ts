import { IOcrResult } from "@splitsies/shared-models";
import { IExpenseItem } from "../../services/expense-service";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";

export interface IExpenseItemsProcessor {
    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[];
}

export const IExpenseItemsProcessor = Symbol.for("IExpenseItemsProcessor");
