import { IExpense } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense-da/expense-da-interface";
import { IDaMapper } from "../da-mapper-interface";

export interface IExpenseMapper extends IDaMapper<IExpense, IExpenseDa> {}
export const IExpenseMapper = Symbol.for("IExpenseMapper");
