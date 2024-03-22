import { IExpense } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDao extends IDao<IExpense> {
    getExpenses(expenseIds: string[]): Promise<IExpense[]>;
    getExpensesForUser(userId: string): Promise<IExpenseDa[]>;
}
export const IExpenseDao = Symbol.for("IExpenseDao");
