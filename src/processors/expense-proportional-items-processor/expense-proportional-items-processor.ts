import { injectable } from "inversify";
import { IOcrResult } from "@splitsies/shared-models";
import { IExpenseProportionalItemsProcessor } from "./expense-proportional-items-processor-interface";
import { IExpenseItem } from "../../services/expense-service";

@injectable()
export class ExpenseProportionalItemsProcessor implements IExpenseProportionalItemsProcessor {
    process(ocrResult: IOcrResult): IExpenseItem[] {
        throw new Error("Method not implemented.");
    }
}
