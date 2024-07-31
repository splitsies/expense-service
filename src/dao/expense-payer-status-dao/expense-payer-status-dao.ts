import { inject, injectable } from "inversify";
import { DaoBase, ILogger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ExpensePayerStatus } from "@splitsies/shared-models";
import { IExpensePayerStatusDao } from "./expense-payer-status-dao-interface";

@injectable()
export class ExpensePayerStatusDao extends DaoBase<ExpensePayerStatus> implements IExpensePayerStatusDao {
    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        const keySelector = (c: ExpensePayerStatus) => ({ expenseId: c.expenseId, userId: c.userId });
        super(logger, dbConfiguration, dbConfiguration.expensePayerStatusTableName, keySelector);
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

        return result.Items?.length ? result.Items.map((i) => unmarshall(i) as ExpensePayerStatus) : [];
    }
}
