import { inject, injectable } from "inversify";
import { IConnectionManager } from "./connection-manager-interface";
import { IConnection } from "src/models/connection/connection-interface";
import { ILogger } from "@splitsies/utils";
import { IConnectionDao } from "src/dao/connection-dao/connection-dao-interface";
import { Connection } from "src/models/connection/connection";
import { NotFoundError } from "src/models/error/not-found-error";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";
import { randomUUID } from "crypto";
import { IConnectionTokenDao } from "src/dao/connection-token-dao/connection-token-dao-interface";

@injectable()
export class ConnectionManager implements IConnectionManager {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionDao) private readonly _connectionDao: IConnectionDao,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
        @inject(IConnectionTokenDao) private readonly _connectionTokenDao: IConnectionTokenDao,
    ) {}

    async createConnection(connectionId: string, expenseId: string): Promise<IConnection> {
        this._logger.debug("creating connection", connectionId, expenseId);
        return await this._connectionDao.create(
            new Connection(
                connectionId,
                expenseId,
                Date.now() + this._connectionConfiguration.ttlMs,
                this._connectionConfiguration.gatewayUrl,
            ),
        );
    }

    async refreshTtl(connectionId: string): Promise<IConnection> {
        const newTtl = Date.now() + this._connectionConfiguration.ttlMs;
        this._logger.debug(`refreshing ttl for connectionId=${connectionId} to ${newTtl}`);

        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);
        const existing = await this._connectionDao.read({ connectionId, expenseId });
        if (!existing) throw new NotFoundError(`Could not find connection with id=${connectionId}`);

        return await this._connectionDao.update(
            new Connection(existing.connectionId, existing.expenseId, newTtl, existing.gatewayUrl),
        );
    }

    async deleteConnection(connectionId: string): Promise<void> {
        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);

        this._logger.debug(`deleting connection ${connectionId} for expense ${expenseId}`);
        if (!connectionId || !expenseId) { return; }
        
        await this._connectionDao.delete({ connectionId, expenseId });
    }

    async deleteExpired(): Promise<void> {
        await this._connectionDao.deleteExpiredConnections();
        await this._connectionTokenDao.deleteExpired();
        return;
    }

    async getRelatedConnections(connectionId: string): Promise<IConnection[]> {
        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);
        return await this._connectionDao.getConnectionsForExpense(expenseId);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        return await this._connectionDao.getExpenseIdForConnection(connectionId);
    }

    async getConnectionsForExpenseId(expenseId: string): Promise<IConnection[]> {
        return await this._connectionDao.getConnectionsForExpense(expenseId);
    }

    async generateConnectionToken(expenseId: string): Promise<string> {
        const token = randomUUID();
        await this._connectionTokenDao.create({
            expenseId,
            connectionId: token,
            ttl: Date.now() + 30000,
            gatewayUrl: this._connectionConfiguration.gatewayUrl,
        });

        return token;
    }

    async verifyConnectionToken(token: string, expenseId: string): Promise<boolean> {
        return await this._connectionTokenDao.verify(token, expenseId);
    }
}
