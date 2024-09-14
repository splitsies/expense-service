import { IDaMapper } from "@splitsies/utils";
import { LeadingExpense } from "src/models/leading-expense";
import { LeadingExpenseDa } from "src/models/leading-expense-da";

export interface ILeadingExpenseMapper extends IDaMapper<LeadingExpense, LeadingExpenseDa> {}
export const ILeadingExpenseMapper = Symbol.for("ILeadingExpenseMapper");