import { IExpenseItem } from "@splitsies/shared-models";
import { DaoBase, ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IExpenseItemDao } from "./expense-item-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

@injectable()
export class ExpenseItemDao extends DaoBase<IExpenseItem> implements IExpenseItemDao {

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
    ) {
        const keySelector = (c: IExpenseItem) => ({ expenseId: c.expenseId, id: c.id });
        super(logger, dbConfiguration, dbConfiguration.expenseItemTableName, keySelector);
    }    

    async getForExpense(expenseId: string): Promise<IExpenseItem[]> {
        const timeout = Date.now() + 10000;
        const items: IExpenseItem[] = [];
        let next = undefined;

        do {
            const response = await this._client.send(new QueryCommand({
                TableName: "Splitsies-ExpenseItem-local",
                ExclusiveStartKey: next,
                KeyConditionExpression: "#expenseId = :expenseId",
                ExpressionAttributeNames: {
                    "#expenseId": "expenseId",
                },
                ExpressionAttributeValues: {
                    ":expenseId": { S: expenseId }
                }
            }));

            items.push(...(response.Items?.map(i => unmarshall(i) as IExpenseItem) ?? []));
            next = response?.LastEvaluatedKey;
        } while (next && Date.now() < timeout);

        return items;
    }    
}