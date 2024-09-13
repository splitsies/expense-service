import { inject, injectable } from "inversify";
import { IConnectionTokenDao } from "./connection-token-dao-interface";
import { IConnection } from "src/models/connection/connection-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { ExecuteStatementCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IConnectionTokenDaoStatements } from "./connection-token-dao-statements-interface";

@injectable()
export class ConnectionTokenDao
    extends DaoBase<IConnection, { connectionId: string; expenseId: string }>
    implements IConnectionTokenDao
{
    readonly key: (c: IConnection) => Record<string, string>;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) private readonly dbConfiguration: IDbConfiguration,
        @inject(IConnectionTokenDaoStatements) private readonly _statements: IConnectionTokenDaoStatements,
    ) {
        const keySelector = (c: IConnection) => ({ connectionId: c.connectionId, expenseId: c.expenseId });
        super(logger, dbConfiguration, dbConfiguration.connectionTokenTableName, keySelector);
        this.key = keySelector;
    }

    async verify(token: string, expenseId: string): Promise<boolean> {
        const result = await this._client.send(
            new QueryCommand({
                TableName: this.dbConfiguration.connectionTokenTableName,
                KeyConditionExpression: "#expenseId = :expenseId AND #connectionId = :connectionId",
                FilterExpression: "#ttl > :now",
                ExpressionAttributeNames: {
                    "#expenseId": "expenseId",
                    "#connectionId": "connectionId",
                    "#ttl": "ttl",
                },
                ExpressionAttributeValues: {
                    ":expenseId": { S: expenseId },
                    ":connectionId": { S: token },
                    ":now": { N: `${Date.now()}` },
                },
            }),
        );

        return result?.Items?.length !== 0;
    }

    async deleteExpired(): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpiredConnections,
                Parameters: [{ N: Date.now().toString() }],
            }),
        );

        const expired = result.Items.map((i) => unmarshall(i) as IConnection);

        if (expired.length <= 0) {
            this._logger.log(`No expired connection tokens to clean up`);
            return [];
        }

        await Promise.all(expired.map((connection) => this.delete(this._keySelector(connection))));
        this._logger.log(
            `Successfully deleted expired connection tokens: ${expired
                .map((c) => `${c.connectionId}::${c.ttl}`)
                .join(",")}`,
        );

        return expired.map((i) => i.connectionId);
    }
}
