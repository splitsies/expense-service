import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IOcrResult, IExpense, Expense } from "@splitsies/shared-models";
import { IExpenseEngine } from "./expense-engine-interface";
import { IImageExpenseProcessor } from "src/processors/image-expense-processor/image-expense-processor-interface";
import { IExpenseDao } from "src/dao/expense-dao/expense-dao-interface";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { ImageProcessingError } from "src/models/error/image-processing-error";

@injectable()
export class ExpenseEngine implements IExpenseEngine {
    constructor(
        @inject(IExpenseDao) private readonly _expenseDao: IExpenseDao,
        @inject(IImageExpenseProcessor) private readonly _imageExpenseProcessor: IImageExpenseProcessor,
    ) {}

    async createExpense(): Promise<IExpense> {
        return await this._expenseDao.create(new Expense(randomUUID(), "", new Date(), [], []));
    }

    async createExpenseFromImage(ocrResult: IOcrResult): Promise<IExpense> {
        const expense = this._imageExpenseProcessor.process(ocrResult);
        if (!expense) throw new ImageProcessingError("Unable to create expense from OCR data");

        return await this._expenseDao.create(expense);
    }

    async updateExpense(id: string, updated: IExpenseUpdate): Promise<IExpense> {
        return await this._expenseDao.update(
            new Expense(id, updated.name, updated.transactionDate, updated.items, updated.proportionalItems),
        );
    }
}
