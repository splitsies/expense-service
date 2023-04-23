import { injectable } from "inversify";
import { IOcrResult } from "@splitsies/shared-models";
import { IExpenseItemsProcessor } from "./expense-items-processor-interface";
import { IExpenseItem } from "../../services/expense-service";
import { IExpenseOcrMetadata } from "../../models/expense-ocr-metadata/expense-ocr-metadata-interface";

@injectable()
export class ExpenseItemsProcessor implements IExpenseItemsProcessor {
    process(ocrResult: IOcrResult, metadata: IExpenseOcrMetadata): IExpenseItem[] {
        throw new Error("Method not implemented.");
    }
}
