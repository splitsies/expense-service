import { IDao } from "@splitsies/utils";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDao extends IDao<IExpenseDa> {
    getExpenses(expenseIds: string[]): Promise<IExpenseDa[]>;
    getExpensesForUser(userId: string): Promise<IExpenseDa[]>;
}
export const IExpenseDao = Symbol.for("IExpenseDao");
