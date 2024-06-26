import { IDao } from "@splitsies/utils";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IUserExpenseDao extends IDao<IUserExpense> {
    readonly key: (model: IUserExpense) => Record<string, string | number>;
    getExpenseIdsForUser(userId: string): Promise<string[]>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    getForUser(userId: string): Promise<IUserExpense[]>;
    getJoinRequestsForUser(userId: string): Promise<IUserExpense[]>;
    getJoinRequestsForExpense(expenseId: string): Promise<IUserExpense[]>;
    deleteForUser(userId: string): Promise<void>;
}
export const IUserExpenseDao = Symbol.for("IUserExpenseDao");
