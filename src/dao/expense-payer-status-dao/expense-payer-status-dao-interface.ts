import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";

export type Key = Pick<ExpensePayerStatus, "expenseId" | "userId">;
export interface IExpensePayerStatusDao extends IDynamoDbDao<ExpensePayerStatus, Key> {
    getForExpense(expenseId: string): Promise<ExpensePayerStatus[]>;
}
export const IExpensePayerStatusDao = Symbol.for("IExpensePayerStatusDao");
