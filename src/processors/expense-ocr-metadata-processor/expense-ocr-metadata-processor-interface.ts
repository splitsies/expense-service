import { IOcrResult } from "@splitsies/shared-models";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";

export interface IExpenseOcrMetadataProcessor {
  process(ocrResult: IOcrResult): IExpenseOcrMetadata;
}

export const IExpenseOcrMetadataProcessor = Symbol.for(
  "IExpenseOcrMetadataProcessor"
);
