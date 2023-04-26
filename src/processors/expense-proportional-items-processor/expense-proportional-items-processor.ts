import { injectable } from "inversify";
import { randomUUID } from "crypto";
import { IOcrResult, IExpenseItem, ITextBlock, ExpenseItem } from "@splitsies/shared-models";
import { IExpenseProportionalItemsProcessor } from "./expense-proportional-items-processor-interface";
import { ExpenseItemsProcessor } from "../expense-items-processor/expense-items-processor";

@injectable()
export class ExpenseProportionalItemsProcessor extends ExpenseItemsProcessor implements IExpenseProportionalItemsProcessor {

    protected override createExpenseItem(
        _itemBlock: ITextBlock,
        priceBlock: ITextBlock,
        isTax: boolean,
        isTip: boolean,
        isSubtotal: boolean,
        isSubtotalAbbrev: boolean,
        _isTotal: boolean): IExpenseItem | undefined {
        
        if (isTax && !(isSubtotal || isSubtotalAbbrev)) {
            return new ExpenseItem(randomUUID(), "Tax", parseFloat(priceBlock.text), []);
        }
        else if (isTip && !(isSubtotal || isSubtotalAbbrev)) { 
            return new ExpenseItem(randomUUID(), "Tip", parseFloat(priceBlock.text), []);
        }
        
        return undefined;
    }
}
