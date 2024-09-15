import { IScanResult } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";
import { Expense } from "src/models/expense";
import { LeadingExpense } from "src/models/leading-expense";
import { Key, LeadingExpenseDa } from "src/models/leading-expense-da";

export interface ILeadingExpenseDao extends IDynamoDbDao<LeadingExpenseDa, Key, LeadingExpense> {
    readByValues(userId: string, expense: Expense): Promise<LeadingExpense>;
    deleteByValues(userId: string, expense: Expense, shouldCommit: Promise<boolean> | undefined): Promise<void>;
    getForUser(userId: string, limit?: number, offset?: Record<string, object>): Promise<IScanResult<LeadingExpense>>;
}

export const ILeadingExpenseDao = Symbol.for("ILeadingExpenseDao");
