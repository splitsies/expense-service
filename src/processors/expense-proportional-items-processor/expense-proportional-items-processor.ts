import { injectable } from "inversify";
import { IOcrResult, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseProportionalItemsProcessor } from "./expense-proportional-items-processor-interface";

@injectable()
export class ExpenseProportionalItemsProcessor implements IExpenseProportionalItemsProcessor {
    process(ocrResult: IOcrResult): IExpenseItem[] {
        throw new Error("Method not implemented.");
    }
}
