import { IExpenseOcrMetadata } from "./expense-ocr-metadata-interface";

export class ExpenseOcrMetadata implements IExpenseOcrMetadata {
  constructor(
    readonly lastTotalPosition: number,
    readonly maxPrice: number,
    readonly slopeMean: number,
    readonly slopeStandardDeviation: number
  ) {}
}
