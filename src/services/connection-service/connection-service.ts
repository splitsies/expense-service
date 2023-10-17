import { inject, injectable } from "inversify";
import { IConnection } from "src/models/connection/connection-interface";
import { IConnectionService } from "./connection-service-interface";
import { IConnectionManager } from "src/managers/connection-manager/connection-manager-interface";

@injectable()
export class ConnectionService implements IConnectionService {
    constructor(@inject(IConnectionManager) private readonly _connectionManager: IConnectionManager) {}

    async create(id: string, expenseId: string): Promise<IConnection> {
        return await this._connectionManager.createConnection(id, expenseId);
    }

    async refreshTtl(id: string): Promise<IConnection> {
        return await this._connectionManager.refreshTtl(id);
    }

    async delete(id: string): Promise<void> {
        return await this._connectionManager.deleteConnection(id);
    }

    async deleteExpired(): Promise<void> {
        return await this._connectionManager.deleteExpired();
    }

    async getRelatedConnections(connectionId: string): Promise<string[]> {
        return await this._connectionManager.getRelatedConnections(connectionId);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        return await this._connectionManager.getExpenseIdForConnection(connectionId);
    }

    async getConnectionsForExpenseId(expenseId: string): Promise<string[]> {
        return await this._connectionManager.getConnectionsForExpenseId(expenseId);
    }
}
