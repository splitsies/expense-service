import { IDynamoDbDao } from "@splitsies/utils";
import { IExpensePayer } from "src/models/expense-payer/expense-payer-interface";

export interface IExpensePayerDao extends IDynamoDbDao<IExpensePayer, { expenseId: string; userId: string }> {
    getForExpense(expenseId: string): Promise<IExpensePayer[]>;
}
export const IExpensePayerDao = Symbol.for("IExpensePayerDao");
