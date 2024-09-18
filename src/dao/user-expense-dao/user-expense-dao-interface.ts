import { IScanResult } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";
import { Key, UserExpenseDa } from "src/models/user-expense-da";
import { UserExpense } from "src/models/user-expense/user-expense";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";

export interface IUserExpenseDao extends IDynamoDbDao<UserExpenseDa, Key, UserExpense> {
    getUsersForExpense(expenseId: string): Promise<string[]>;
    getForUser(userId: string): Promise<IUserExpense[]>;
    getJoinRequestsForUser(
        userId: string,
        limit: number,
        offset?: Record<string, object>,
    ): Promise<IScanResult<IUserExpense>>;
    getJoinRequestCountForUser(userId: string): Promise<number>;
    getJoinRequestsForExpense(expenseId: string): Promise<IUserExpense[]>;
}
export const IUserExpenseDao = Symbol.for("IUserExpenseDao");
