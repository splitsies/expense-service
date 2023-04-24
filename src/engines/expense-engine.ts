import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IOcrResult, IExpense, Expense} from "@splitsies/shared-models";
import { IExpenseEngine } from "./expense-engine-interface";
import { IImageExpenseProcessor } from "src/processors/image-expense-processor/image-expense-processor-interface";

@injectable()
export class ExpenseEngine implements IExpenseEngine {
    constructor(@inject(IImageExpenseProcessor) private readonly _imageExpenseProcessor: IImageExpenseProcessor) {}

    createExpense(): IExpense {
        return new Expense(randomUUID(), "", new Date(), [], []);
    }

    createExpenseFromImage(ocrResult: IOcrResult): IExpense {
        const expense = this._imageExpenseProcessor.process(ocrResult);
        if (!expense) throw new Error("Unable to create expense from OCR data");

        // TODO: save to DB

        return expense;
    }

    updateExpense(id: string, updated: Omit<IExpense, "id">): IExpense {
        const updatedExpense = new Expense(
            id,
            updated.name,
            updated.transactionDate,
            updated.items,
            updated.proportionalItems,
        );

        // TODO: Save the updated expense in DB

        return updatedExpense;
    }
}
