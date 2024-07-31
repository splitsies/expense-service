import { inject, injectable } from "inversify";
import { IExpensePayerDao } from "./expense-payer-dao-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IExpensePayer } from "src/models/expense-payer/expense-payer-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

@injectable()
export class ExpensePayerDao extends DaoBase<IExpensePayer> implements IExpensePayerDao {
    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        console.log({ name: dbConfiguration.expensePayerTableName });
        const keySelector = (c: IExpensePayer) => ({ expenseId: c.expenseId, userId: c.userId });
        super(logger, dbConfiguration, dbConfiguration.expensePayerTableName, keySelector);
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

        return result.Items?.length ? result.Items.map((i) => unmarshall(i) as IExpensePayer) : [];
    }
}
