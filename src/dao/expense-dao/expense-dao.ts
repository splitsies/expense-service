import { inject, injectable } from "inversify";
import { IExpense } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";

import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";
import { IExpenseMapper } from "src/mappers/expense-mapper/expense-mapper-interface";
import { IExpenseDa } from "src/models/expense-da/expense-da-interface";
import { NotFoundError } from "src/models/error/not-found-error";

@injectable()
export class ExpenseDao implements IExpenseDao {
    private readonly _client: DynamoDBClient;

    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IDbConfiguration) private readonly _dbConfiguration: IDbConfiguration,
        @inject(IExpenseMapper) private readonly _mapper: IExpenseMapper,
    ) {
        this._client = new DynamoDBClient({
            credentials: {
                accessKeyId: this._dbConfiguration.dbAccessKeyId,
                secretAccessKey: this._dbConfiguration.dbSecretAccessKey,
            },
            region: this._dbConfiguration.dbRegion,
            endpoint: this._dbConfiguration.endpoint,
        });
    }

    async create(expense: IExpense): Promise<IExpense> {
        const expenseDa = this._mapper.toDaModel(expense);
        this._logger.log(marshall(expenseDa, { convertClassInstanceToMap: true }) as any);

        const result = await this._client.send(
            new PutItemCommand({
                TableName: this._dbConfiguration.tableName,
                Item: marshall(expenseDa, { convertClassInstanceToMap: true }),
            }),
        );

        if (result.$metadata.httpStatusCode !== 200) return undefined;
        return this.read(expense.id);
    }

    async read(id: string): Promise<IExpense> {
        const readResult = await this._client.send(
            new GetItemCommand({
                TableName: this._dbConfiguration.tableName,
                Key: marshall({ id }, { convertClassInstanceToMap: true }),
            }),
        );

        if (!readResult.Item) return undefined;

        const result = unmarshall(readResult.Item);
        return result ? this._mapper.toDomainModel(result as IExpenseDa) : undefined;
    }

    async update(updated: IExpense): Promise<IExpense> {
        const exists = !!(await this.read(updated.id));
        if (!exists) throw new NotFoundError(`Expense with id=${updated.id} not found`);

        // CREATE and UPDATE are the same in DynamoDB
        return await this.create(updated);
    }

    async delete(id: string): Promise<void> {
        await this._client.send(
            new DeleteItemCommand({
                TableName: this._dbConfiguration.tableName,
                Key: { id: { S: id } },
            }),
        );
    }
}
