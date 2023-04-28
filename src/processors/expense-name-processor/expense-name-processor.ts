import { injectable } from "inversify";
import { IExpenseNameProcessor } from "./expense-name-processor-interface";
import { IOcrResult } from "@splitsies/shared-models";

@injectable()
export class ExpenseNameProcessor implements IExpenseNameProcessor {
    process(ocrResult: IOcrResult): string {
        // TODO: find a better way to get the name
        return ocrResult.textBlocks?.[0]?.text ?? "";
    }
}
