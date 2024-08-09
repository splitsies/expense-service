import { IScanResult } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDao extends IDao<IExpenseDa> {
    getExpenses(expenseIds: string[]): Promise<IExpenseDa[]>;
    getExpensesForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IExpenseDa>>;
    getChildExpenseIds(parentExpenseId: string): Promise<string[]>;
}
export const IExpenseDao = Symbol.for("IExpenseDao");
