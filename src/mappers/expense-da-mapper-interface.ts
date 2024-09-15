import { IDaMapper } from "@splitsies/utils";
import { Expense } from "src/models/expense";
import { ExpenseDa } from "src/models/expense-da";

export interface IExpenseDaMapper extends IDaMapper<Expense, ExpenseDa> {}
export const IExpenseDaMapper = Symbol.for("IExpenseDaMapper");
