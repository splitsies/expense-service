import { IDynamoDbDao } from "@splitsies/utils";
import { Expense } from "src/models/expense";
import { ExpenseDa, Key } from "src/models/expense-da";

export interface IExpenseDao extends IDynamoDbDao<ExpenseDa, Key, Expense> {}
export const IExpenseDao = Symbol.for("IExpenseDao");
