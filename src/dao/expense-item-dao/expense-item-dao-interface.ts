import { IExpenseItem } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";

export type Key = Pick<IExpenseItem, "id" | "expenseId">;
export interface IExpenseItemDao extends IDynamoDbDao<IExpenseItem, Key> {
    getForExpense(expenseId: string): Promise<IExpenseItem[]>;
}
export const IExpenseItemDao = Symbol.for("IExpenseItemDao");
