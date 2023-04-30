import { injectable } from "inversify";
import { randomUUID } from "crypto";
import { IExpenseItem, ExpenseItem } from "@splitsies/shared-models";
import { IExpenseProportionalItemsProcessor } from "./expense-proportional-items-processor-interface";
import { ExpenseItemsProcessor } from "../expense-items-processor/expense-items-processor";

@injectable()
export class ExpenseProportionalItemsProcessor
    extends ExpenseItemsProcessor
    implements IExpenseProportionalItemsProcessor
{
    protected override createExpenseItem(
        _itemText: string,
        priceText: string,
        isTax: boolean,
        isTip: boolean,
        isSubtotal: boolean,
        isSubtotalAbbrev: boolean,
        _isTotal: boolean,
    ): IExpenseItem | undefined {
        if (isTax && !(isSubtotal || isSubtotalAbbrev)) {
            return new ExpenseItem(randomUUID(), "Tax", this.formatPrice(priceText), []);
        } else if (isTip && !(isSubtotal || isSubtotalAbbrev)) {
            return new ExpenseItem(randomUUID(), "Tip", this.formatPrice(priceText), []);
        }

        return undefined;
    }
}
