import { DaoBase, ILogger, IPageInfoMapper } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { LeadingExpense } from "src/models/leading-expense";
import { ILeadingExpenseDao } from "./leading-expense-dao.i";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { AttributeValue, QueryCommand } from "@aws-sdk/client-dynamodb";
import { IScanResult, ScanResult } from "@splitsies/shared-models";
import { ILeadingExpenseMapper } from "src/mappers/leading-expense-mapper/leading-expense-mapper.i";
import { Key, LeadingExpenseDa } from "src/models/leading-expense-da";
import { Expense } from "src/models/expense";

@injectable()
export class LeadingExpenseDao extends DaoBase<LeadingExpenseDa, Key, LeadingExpense> implements ILeadingExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(ILeadingExpenseMapper) leadingExpenseMapper: ILeadingExpenseMapper,
        @inject(IPageInfoMapper) private readonly _pageInfoMapper: IPageInfoMapper,
    ) {
        super(
            logger,
            dbConfiguration,
            dbConfiguration.leadingExpenseTableName,
            (m) => ({ userId: m.userId, transactionDateExpenseId: m.transactionDateExpenseId }),
            leadingExpenseMapper,
        );
    }

    readByValues(userId: string, expense: Expense): Promise<LeadingExpense> {
        const model = new LeadingExpense(userId, expense.transactionDate, expense.id);
        const key = this.keyFrom(model);
        return this.read(key);
    }

    deleteByValues(userId: string, expense: Expense, shouldCommit: Promise<boolean> | undefined): Promise<void> {
        const model = new LeadingExpense(userId, expense.transactionDate, expense.id);
        const key = this.keyFrom(model);
        return this.delete(key, shouldCommit);
    }

    async getForUser(
        userId: string,
        limit: number = 10,
        offset: Record<string, object> = undefined,
    ): Promise<IScanResult<LeadingExpense>> {
        const result = await this._client.send(
            new QueryCommand({
                TableName: this._tableName,
                KeyConditionExpression: "#userId = :userId",
                ExpressionAttributeNames: { "#userId": "userId" },
                ExpressionAttributeValues: { ":userId": { S: userId } },
                Limit: limit,
                ScanIndexForward: false,
                ExclusiveStartKey: offset as Record<string, AttributeValue> | undefined,
            }),
        );

        return new ScanResult(
            this.unmarshallResults(result),
            this._pageInfoMapper.fromResult(result, this._keyMapper.bind(this), limit, offset),
        );
    }
}
