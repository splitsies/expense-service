import { inject, injectable } from "inversify";
import { IExpensePayerDao } from "./expense-payer-dao-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IExpensePayer, Key } from "src/models/expense-payer/expense-payer-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

@injectable()
export class ExpensePayerDao extends DaoBase<IExpensePayer, Key> implements IExpensePayerDao {
    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        super(logger, dbConfiguration, dbConfiguration.expensePayerTableName, (m) => ({
            expenseId: m.expenseId,
            userId: m.userId,
        }));
    }

    async getForExpense(expenseId: string): Promise<IExpensePayer[]> {
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
