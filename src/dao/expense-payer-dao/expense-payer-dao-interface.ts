import { IDynamoDbDao } from "@splitsies/utils";
import { IExpensePayer, Key } from "src/models/expense-payer/expense-payer-interface";

export interface IExpensePayerDao extends IDynamoDbDao<IExpensePayer, Key> {
    getForExpense(expenseId: string): Promise<IExpensePayer[]>;
}
export const IExpensePayerDao = Symbol.for("IExpensePayerDao");
