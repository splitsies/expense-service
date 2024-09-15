import { IDynamoDbDao } from "@splitsies/utils";
import { ExpenseGroup, Key } from "src/models/expense-group";

export interface IExpenseGroupDao extends IDynamoDbDao<ExpenseGroup, Key> {
    getParentExpenseId(childExpenseId: string): Promise<string | undefined>;
    getChildExpenseIds(parentExpenseId: string): Promise<string[]>;
}
export const IExpenseGroupDao = Symbol.for("IExpenseGroupDao");
