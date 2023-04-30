import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { IOcrResult, IExpense, Expense } from "@splitsies/shared-models";
import { ILogger } from "@splitsies/utils";
import { IImageExpenseProcessor } from "./image-expense-processor-interface";
import { IExpenseOcrMetadataProcessor } from "../expense-ocr-metadata-processor/expense-ocr-metadata-processor-interface";
import { IExpenseNameProcessor } from "../expense-name-processor/expense-name-processor-interface";
import { IExpenseProportionalItemsProcessor } from "../expense-proportional-items-processor/expense-proportional-items-processor-interface";
import { IExpenseItemsProcessor } from "../expense-items-processor/expense-items-processor-interface";
import { IExpenseDateProcessor } from "../expense-date-processor/expense-date-processor-interface";

@injectable()
export class ImageExpenseProcessor implements IImageExpenseProcessor {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IExpenseOcrMetadataProcessor)
        private readonly _expenseOcrMetadataProcessor: IExpenseOcrMetadataProcessor,
        @inject(IExpenseNameProcessor) private readonly _nameProcessor: IExpenseNameProcessor,
        @inject(IExpenseDateProcessor) private readonly _dateProcessor: IExpenseDateProcessor,
        @inject(IExpenseItemsProcessor) private readonly _itemsProcessor: IExpenseItemsProcessor,
        @inject(IExpenseProportionalItemsProcessor)
        private readonly _proportionalItemsProcessor: IExpenseProportionalItemsProcessor,
    ) {}

    process(ocrResult: IOcrResult): IExpense {
        try {
            const metadata = this._expenseOcrMetadataProcessor.process(ocrResult);

            const name = this._nameProcessor.process(ocrResult);
            const date = this._dateProcessor.process(ocrResult);
            const items = this._itemsProcessor.process(ocrResult, metadata);
            const proportionalItems = this._proportionalItemsProcessor.process(ocrResult, metadata);

            return new Expense(randomUUID(), name, date, items, proportionalItems);
        } catch (e) {
            this._logger.error(e);
            return undefined;
        }
    }
}
