import { IExpense } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";

export interface IExpenseDao extends IDao<IExpense> {
    getExpensesForUser(userId: string): Promise<IExpense[]>;
}
export const IExpenseDao = Symbol.for("IExpenseDao");
