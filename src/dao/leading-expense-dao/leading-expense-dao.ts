import { DaoBase, ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { LeadingExpense } from "src/models/leading-expense";
import { ILeadingExpenseDao } from "./leading-expense-dao.i";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { AttributeValue, QueryCommand } from "@aws-sdk/client-dynamodb";
import { IScanResult, ScanResult } from "@splitsies/shared-models";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ILeadingExpenseMapper } from "src/mappers/leading-expense-mapper/leading-expense-mapper.i";
import { LeadingExpenseDa } from "src/models/leading-expense-da";

@injectable()
export class LeadingExpenseDao
    extends DaoBase<LeadingExpenseDa, { userId: string, transactionDateExpenseId: string; }, LeadingExpense>
    implements ILeadingExpenseDao {
    
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(ILeadingExpenseMapper) leadingExpenseMapper: ILeadingExpenseMapper) {
        super(logger, dbConfiguration, "Splitsies-LeadingExpense-local", undefined, leadingExpenseMapper);
    }
        
    async getForUser(userId: string, limit: number = 10, offset: Record<string, AttributeValue> | undefined): Promise<IScanResult<LeadingExpense>> {
        const result = await this._client.send(new QueryCommand({
            TableName: this._tableName,
            KeyConditionExpression: "#userId = :userId",
            ExpressionAttributeNames: {
                "#userId": "userId",
            },
            ExpressionAttributeValues: {
                ":userId": { S: userId }
            },
            Limit: limit,
            ScanIndexForward: false,
            ExclusiveStartKey: offset
        }));

        return new ScanResult(
            (result.Items ?? []).map(i => this._mapper.toDomain(unmarshall(i) as LeadingExpenseDa)),
            result.LastEvaluatedKey
        );
    }
}