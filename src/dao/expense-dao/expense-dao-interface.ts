import { IExpense } from "@splitsies/shared-models";
import { IDao } from "../dao-interface";

export interface IExpenseDao extends IDao<IExpense, string> {}
export const IExpenseDao = Symbol.for("IExpenseDao");
