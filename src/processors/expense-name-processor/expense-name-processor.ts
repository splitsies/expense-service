import { injectable } from "inversify";
import { IExpenseNameProcessor } from "./expense-name-processor-interface";
import { IOcrResult } from "@splitsies/shared-models";

@injectable()
export class ExpenseNameProcessor implements IExpenseNameProcessor {
  process(ocrResult: IOcrResult): string {
    throw new Error("Method not implemented.");
  }
}
