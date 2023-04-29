import { inject, injectable } from "inversify";
import { IExpense } from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { IExpenseDao } from "./expense-dao-interface";

import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";

@injectable()
export class ExpenseDao implements IExpenseDao {
    private readonly _client: DynamoDBClient;

    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IDbConfiguration) private readonly _dbConfiguration: IDbConfiguration) {
        this._client = new DynamoDBClient({
            credentials: {
                accessKeyId: this._dbConfiguration.dbAccessKeyId,
                secretAccessKey: this._dbConfiguration.dbSecretAccessKey,
            },
            region: this._dbConfiguration.dbRegion,
            endpoint: this._dbConfiguration.endpoint,
        });
    }

    async upsert(expense: IExpense): Promise<IExpense> {
        const result = await this._client.send(
            new PutItemCommand({
                TableName: this._dbConfiguration.tableName,
                Item: marshall(expense, { convertClassInstanceToMap: true }),
            }),
        );
        
        if (result.$metadata.httpStatusCode !== 200) return;

        return this.read(expense.id);
    }

    async read(id: string): Promise<IExpense> {
        const readResult = await this._client.send(
            new GetItemCommand({
                TableName: this._dbConfiguration.tableName,
                Key: marshall({ id }, { convertClassInstanceToMap: true }),
            }),
        );

        return unmarshall(readResult.Item) as IExpense;
    }

    async update(id: string, update: IExpenseUpdate): Promise<IExpense> {
        throw new Error("Method not implemented.");
    }

    async delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
