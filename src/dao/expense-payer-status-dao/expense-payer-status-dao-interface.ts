import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IDao } from "@splitsies/utils";

export interface IExpensePayerStatusDao extends IDao<ExpensePayerStatus, { expenseId: string; userId: string }> {
    getForExpense(expenseId: string): Promise<ExpensePayerStatus[]>;
}
export const IExpensePayerStatusDao = Symbol.for("IExpensePayerStatusDao");
