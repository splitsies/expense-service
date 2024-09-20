import { inject, injectable } from "inversify";
import { IConnectionDao } from "./connection-dao-interface";
import { IConnection, Key } from "src/models/connection/connection-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { ExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IConnectionDaoStatements } from "./connection-dao-statements-interface";

@injectable()
export class ConnectionDao extends DaoBase<IConnection, Key> implements IConnectionDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IConnectionDaoStatements) private readonly _statements: IConnectionDaoStatements,
    ) {
        super(logger, dbConfiguration, dbConfiguration.connectionTableName, (m) => ({
            expenseId: m.expenseId,
            connectionId: m.connectionId,
        }));
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpenseIdForConnection,
                Parameters: [{ S: connectionId }, { N: Date.now().toString() }],
            }),
        );

        return this.unmarshall(result?.Items[0]).expenseId;
    }

    async getConnectionsForExpense(expenseId: string): Promise<IConnection[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetConnectionsForExpense,
                Parameters: [{ S: expenseId }, { N: Date.now().toString() }],
            }),
        );

        return this.unmarshallResults(result);
    }

    async deleteExpiredConnections(): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpiredConnections,
                Parameters: [{ N: Date.now().toString() }],
            }),
        );

        const expired = this.unmarshallResults(result);

        if (expired.length <= 0) {
            this._logger.log(`No expired connections to clean up`);
            return [];
        }

        await Promise.all(expired.map((connection) => this.delete(this.keyFrom(connection))));
        this._logger.log(
            `Successfully deleted expired connections: ${expired.map((c) => `${c.connectionId}::${c.ttl}`).join(",")}`,
        );

        return expired.map((i) => i.connectionId);
    }
}
