import { IScanResult } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";
import { LeadingExpense } from "src/models/leading-expense";
import { Key, LeadingExpenseDa } from "src/models/leading-expense-da";

export interface ILeadingExpenseDao extends IDynamoDbDao<LeadingExpenseDa, Key, LeadingExpense> {
    getForUser(userId: string, limit?: number, offset?: Record<string, object>): Promise<IScanResult<LeadingExpense>>;
}

export const ILeadingExpenseDao = Symbol.for("ILeadingExpenseDao");
