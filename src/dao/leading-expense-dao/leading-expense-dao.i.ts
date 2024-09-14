import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { IScanResult } from "@splitsies/shared-models";
import { IDynamoDbDao } from "@splitsies/utils";
import { LeadingExpense } from "src/models/leading-expense";
import { LeadingExpenseDa } from "src/models/leading-expense-da";

export interface ILeadingExpenseDao extends IDynamoDbDao<LeadingExpenseDa, { userId: string, transactionDateExpenseId: string; }, LeadingExpense> { 
    getForUser(userId: string, limit?: number, offset?: Record<string, AttributeValue>): Promise<IScanResult<LeadingExpense>>;
}

export const ILeadingExpenseDao = Symbol.for("ILeadingExpenseDao");