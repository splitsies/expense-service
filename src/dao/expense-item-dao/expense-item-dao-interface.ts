import { IExpenseItem } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";

export interface IExpenseItemDao extends IDynamoDbDao<IExpenseItem, { id: string; expenseId: string }> {
    getForExpense(expenseId: string): Promise<IExpenseItem[]>;
}
export const IExpenseItemDao = Symbol.for("IExpenseItemDao");
