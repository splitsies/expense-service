import { injectable } from "inversify";
import { IOcrResult } from "@splitsies/shared-models";
import { IExpenseDateProcessor } from "./expense-date-processor-interface";
import { ExpenseRegex } from "src/constants/expense-regex";

@injectable()
export class ExpenseDateProcessor implements IExpenseDateProcessor {
    process(ocrResult: IOcrResult): Date {
        const matches = ocrResult.textBlocks.filter(block => ExpenseRegex.Date.test(block.text))
        if (!matches.length) return new Date();

        return new Date(Date.parse(matches[0].text));
    }
}
