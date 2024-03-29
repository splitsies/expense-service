import { inject, injectable } from "inversify";
import { IConnectionManager } from "./connection-manager-interface";
import { IConnection } from "src/models/connection/connection-interface";
import { ILogger } from "@splitsies/utils";
import { IConnectionDao } from "src/dao/connection-dao/connection-dao-interface";
import { Connection } from "src/models/connection/connection";
import { NotFoundError } from "src/models/error/not-found-error";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

@injectable()
export class ConnectionManager implements IConnectionManager {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionDao) private readonly _connectionDao: IConnectionDao,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
    ) {}

    async createConnection(connectionId: string, expenseId: string): Promise<IConnection> {
        this._logger.debug("creating connection", connectionId, expenseId);
        return await this._connectionDao.create(
            new Connection(connectionId, expenseId, Date.now() + this._connectionConfiguration.ttlMs),
        );
    }

    async refreshTtl(connectionId: string): Promise<IConnection> {
        const newTtl = Date.now() + this._connectionConfiguration.ttlMs;
        this._logger.debug(`refreshing ttl for connectionId=${connectionId} to ${newTtl}`);

        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);
        const existing = await this._connectionDao.read({ connectionId, expenseId });
        if (!existing) throw new NotFoundError(`Could not find connection with id=${connectionId}`);

        return await this._connectionDao.update(new Connection(existing.connectionId, existing.expenseId, newTtl));
    }

    async deleteConnection(connectionId: string): Promise<void> {
        this._logger.debug(`deleting connection ${connectionId}`);

        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);
        await this._connectionDao.delete({ connectionId, expenseId });
    }

    async deleteExpired(): Promise<void> {
        await this._connectionDao.deleteExpiredConnections();
        return;
    }

    async getRelatedConnections(connectionId: string): Promise<string[]> {
        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);
        return await this._connectionDao.getConnectionsForExpense(expenseId);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        return await this._connectionDao.getExpenseIdForConnection(connectionId);
    }

    async getConnectionsForExpenseId(expenseId: string): Promise<string[]> {
        return await this._connectionDao.getConnectionsForExpense(expenseId);
    }
}
