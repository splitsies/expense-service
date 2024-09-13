import { IScanResult } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IUserExpenseDao extends IDao<IUserExpense, { expenseId: string; userId: string }> {
    readonly key: (model: IUserExpense) => { expenseId: string; userId: string };
    getExpenseIdsForUser(userId: string): Promise<string[]>;
    getUsersForExpense(expenseId: string): Promise<string[]>;
    getForUser(userId: string): Promise<IUserExpense[]>;
    getJoinRequestsForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IUserExpense>>;
    getJoinRequestCountForUser(userId: string): Promise<number>;
    getJoinRequestsForExpense(expenseId: string): Promise<IUserExpense[]>;
    deleteForUser(userId: string): Promise<void>;
}
export const IUserExpenseDao = Symbol.for("IUserExpenseDao");
