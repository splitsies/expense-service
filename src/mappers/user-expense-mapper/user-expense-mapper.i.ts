import { IDaMapper } from "@splitsies/utils";
import { UserExpenseDa } from "src/models/user-expense-da";
import { UserExpense } from "src/models/user-expense/user-expense";

export interface IUserExpenseDaMapper extends IDaMapper<UserExpense, UserExpenseDa> {}
export const IUserExpenseDaMapper = Symbol.for("IUserExpenseDaMapper");
