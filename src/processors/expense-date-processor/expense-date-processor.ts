import { injectable } from "inversify";
import { IOcrResult } from "@splitsies/shared-models";
import { IExpenseDateProcessor } from "./expense-date-processor-interface";

@injectable()
export class ExpenseDateProcessor implements IExpenseDateProcessor {
  process(ocrResult: IOcrResult): Date {
    throw new Error("Method not implemented.");
  }
}
