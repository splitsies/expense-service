import { inject, injectable } from "inversify";
import { IConnectionDao } from "./connection-dao-interface";
import { IConnection } from "src/models/connection/connection-interface";
import { ILogger } from "@splitsies/utils";
import { ExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IConnectionDaoStatements } from "./connection-dao-statements-interface";
import { DaoBase } from "../dao-base";

@injectable()
export class ConnectionDao extends DaoBase<IConnection> implements IConnectionDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IConnectionDaoStatements) private readonly _statements: IConnectionDaoStatements,
    ) {
        const keySelector = (c: IConnection) => ({ connectionId: c.connectionId, expenseId: c.expenseId });
        super(logger, dbConfiguration, dbConfiguration.connectionTableName, keySelector);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpenseIdForConnection,
                Parameters: [{ S: connectionId }, { N: Date.now().toString() }],
            }),
        );

        return result.Items?.length ? unmarshall(result.Items[0]).expenseId : undefined;
    }

    async getConnectionsForExpense(expenseId: string): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetConnectionIdsForExpense,
                Parameters: [{ S: expenseId }, { N: Date.now().toString() }],
            }),
        );

        return result.Items ? result.Items.map((i) => unmarshall(i).connectionId as string) : [];
    }

    async deleteExpiredConnections(): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpiredConnections,
                Parameters: [{ N: Date.now().toString() }],
            }),
        );

        const expired = result.Items.map((i) => unmarshall(i) as IConnection);

        if (expired.length <= 0) {
            this._logger.log(`No expired connections to clean up`);
            return [];
        }

        await Promise.all(expired.map((connection) => this.delete(connection.connectionId, connection.expenseId)));
        this._logger.log(
            `Successfully deleted expired connections: ${expired.map((c) => `${c.connectionId}::${c.ttl}`).join(",")}`,
        );

        return expired.map((i) => i.connectionId);
    }
}
