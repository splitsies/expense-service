import { IDao } from "@splitsies/utils";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IUserExpenseDao extends IDao<IUserExpense> {
    getExpenseIdsForUser(userId: string): Promise<string[]>;
}
export const IUserExpenseDao = Symbol.for("IUserExpenseDao");
