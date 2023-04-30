import { inject, injectable } from "inversify";
import { IConnectionDao } from "./connection-dao-interface";
import { IConnection } from "src/models/connection/connection-interface";
import { ILogger } from "@splitsies/utils";
import { DeleteItemCommand, DynamoDBClient, ExecuteStatementCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { NotFoundError } from "src/models/error/not-found-error";
import { IConnectionDaoStatements } from "./connection-dao-statements-interface";

@injectable()
export class ConnectionDao implements IConnectionDao {
    private readonly _client: DynamoDBClient;
    private readonly _table: string;

    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IDbConfiguration) private readonly _dbConfiguration: IDbConfiguration,
        @inject(IConnectionDaoStatements) private readonly _statements: IConnectionDaoStatements,
    ) {
        this._table = this._dbConfiguration.connectionTableName;
        this._client = new DynamoDBClient({
            credentials: {
                accessKeyId: this._dbConfiguration.dbAccessKeyId,
                secretAccessKey: this._dbConfiguration.dbSecretAccessKey,
            },
            region: this._dbConfiguration.dbRegion,
            endpoint: this._dbConfiguration.endpoint,
        });
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpenseIdForConnection,
                Parameters: [{ S: connectionId }],
            }),
        );

        return result.Items ? unmarshall(result.Items[0]).expenseId : undefined;
    }

    async getConnectionsForExpense(expenseId: string): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetConnectionIdsForExpense,
                Parameters: [{ S: expenseId }],
            }),
        );

        return result.Items ? result.Items.map((i) => unmarshall(i).connectionId as string) : [];
    }

    async create(model: IConnection): Promise<IConnection> {
        const result = await this._client.send(
            new PutItemCommand({
                TableName: this._table,
                Item: marshall(model, { convertClassInstanceToMap: true }),
            }),
        );

        if (result.$metadata.httpStatusCode !== 200) return undefined;
        return this.read(model.connectionId);
    }

    async read(connectionId: string): Promise<IConnection> {
        const readResult = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetByConnectionId,
                Parameters: [{ S: connectionId }],
            }),
        );

        return readResult.Items ? (unmarshall(readResult.Items[0]) as IConnection) : undefined;
    }

    async update(updated: IConnection): Promise<IConnection> {
        const exists = !!(await this.read(updated.connectionId));
        if (!exists) throw new NotFoundError(`Expense with id=${updated.connectionId} not found`);

        // CREATE and UPDATE are the same in DynamoDB
        return await this.create(updated);
    }

    async delete(id: string, expenseId: string = undefined): Promise<void> {
        if (!expenseId) expenseId = await this.getExpenseIdForConnection(id);
        if (!expenseId) {
            this._logger.warn(`Attempted to delete connection id=${id} that did not exist`);
            return;
        }

        await this._client.send(
            new DeleteItemCommand({
                TableName: this._table,
                Key: {
                    connectionId: { S: id },
                    expenseId: { S: expenseId },
                },
            }),
        );
    }

    async deleteExpiredConnections(): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpiredConnectionIds,
                Parameters: [{ N: Date.now().toString() }],
            }),
        );

        const expiredIds = result.Items.map((i) => unmarshall(i) as { connectionId: string; expenseId: string });
        await Promise.all(expiredIds.map((ids) => this.delete(ids.connectionId, ids.expenseId)));

        return expiredIds.map((i) => i.connectionId);
    }
}
