import { IExpenseItem } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";

export interface IExpenseItemDao extends IDao<IExpenseItem> {
    getForExpense(expenseId: string): Promise<IExpenseItem[]>;
}
export const IExpenseItemDao = Symbol.for("IExpenseItemDao");
