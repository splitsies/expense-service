import { inject, injectable } from "inversify";
import { IConnectionEngine } from "./connection-engine-interface";
import { IConnection } from "src/models/connection/connection-interface";
import { ILogger } from "@splitsies/utils";
import { IConnectionDao } from "src/dao/connection-dao/connection-dao-interface";
import { Connection } from "src/models/connection/connection";
import { NotFoundError } from "src/models/error/not-found-error";
import { IConnectionConfiguration } from "src/models/configuration/connection/connection-configuration-interface";

@injectable()
export class ConnectionEngine implements IConnectionEngine {
    constructor(
        @inject(ILogger) private readonly _logger: ILogger,
        @inject(IConnectionDao) private readonly _connectionDao: IConnectionDao,
        @inject(IConnectionConfiguration) private readonly _connectionConfiguration: IConnectionConfiguration,
    ) {}

    async createConnection(connectionId: string, expenseId: string): Promise<IConnection> {
        return await this._connectionDao.create(
            new Connection(connectionId, expenseId, Date.now() + this._connectionConfiguration.ttlMs),
        );
    }

    async refreshTtl(connectionId: string): Promise<IConnection> {
        const existing = await this._connectionDao.read(connectionId);
        if (!existing) throw new NotFoundError(`Could not find connection with id=${connectionId}`);

        return await this._connectionDao.create(
            new Connection(existing.connectionId, existing.expenseId, Date.now() + this._connectionConfiguration.ttlMs),
        );
    }

    async deleteConnection(connectionId: string): Promise<void> {
        await this._connectionDao.delete(connectionId);
    }

    async getRelatedConnections(connectionId: string): Promise<string[]> {
        const expenseId = await this._connectionDao.getExpenseIdForConnection(connectionId);
        return await this._connectionDao.getConnectionsForExpense(expenseId);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        return await this._connectionDao.getExpenseIdForConnection(connectionId);
    }
}
