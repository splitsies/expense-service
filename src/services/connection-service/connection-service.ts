import { inject, injectable } from "inversify";
import { IConnection } from "src/models/connection/connection-interface";
import { IConnectionService } from "./connection-service-interface";
import { IConnectionEngine } from "src/engines/connection-engine/connection-engine-interface";

@injectable()
export class ConnectionService implements IConnectionService {
    constructor(@inject(IConnectionEngine) private readonly _connectionEngine: IConnectionEngine) {}

    async create(id: string, expenseId: string): Promise<IConnection> {
        return await this._connectionEngine.createConnection(id, expenseId);
    }

    async refreshTtl(id: string): Promise<IConnection> {
        return await this._connectionEngine.refreshTtl(id);
    }

    async delete(id: string): Promise<void> {
        return await this._connectionEngine.deleteConnection(id);
    }

    async deleteExpired(): Promise<void> {
        return await this._connectionEngine.deleteExpired();
    }

    async getRelatedConnections(connectionId: string): Promise<string[]> {
        return await this._connectionEngine.getRelatedConnections(connectionId);
    }

    async getExpenseIdForConnection(connectionId: string): Promise<string> {
        return await this._connectionEngine.getExpenseIdForConnection(connectionId);
    }
}
