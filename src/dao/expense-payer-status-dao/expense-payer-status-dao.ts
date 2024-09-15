import { inject, injectable } from "inversify";
import { DaoBase, ILogger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IExpensePayerStatusDao, Key } from "./expense-payer-status-dao-interface";

@injectable()
export class ExpensePayerStatusDao extends DaoBase<ExpensePayerStatus, Key> implements IExpensePayerStatusDao {
    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        super(logger, dbConfiguration, dbConfiguration.expensePayerStatusTableName, (m) => ({
            expenseId: m.expenseId,
            userId: m.userId,
        }));
    }

    async getForExpense(expenseId: string): Promise<ExpensePayerStatus[]> {
        const result = await this._client.send(
            new QueryCommand({
                TableName: this._tableName,
                KeyConditionExpression: `#expenseId = :expenseId`,
                ExpressionAttributeNames: {
                    "#expenseId": "expenseId",
                },
                ExpressionAttributeValues: {
                    ":expenseId": { S: expenseId },
                },
            }),
        );

        return this.unmarshallResults(result);
    }
}
