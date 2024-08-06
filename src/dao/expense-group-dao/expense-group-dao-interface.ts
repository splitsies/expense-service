import { IDao } from "@splitsies/utils";
import { ExpenseGroupDa } from "src/models/expense-group-da";

export interface IExpenseGroupDao extends IDao<ExpenseGroupDa> {}
export const IExpenseGroupDao = Symbol.for("IExpenseGroupDao");
