import { IDao } from "@splitsies/utils";
import { ExpenseGroupDa } from "src/models/expense-group-da";

export interface IExpenseGroupDao extends IDao<ExpenseGroupDa> {
    getParentExpenseId(childExpenseId: string): Promise<string | undefined>;
    getChildExpenseIds(parentExpenseId: string): Promise<string[]>;
}
export const IExpenseGroupDao = Symbol.for("IExpenseGroupDao");
