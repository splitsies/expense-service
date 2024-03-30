import { inject, injectable } from "inversify";
import { IConnection } from "src/models/connection/connection-interface";
import { IConnectionService } from "./connection-service-interface";
import { IConnectionManager } from "src/managers/connection-manager/connection-manager-interface";

@injectable()
export class ConnectionService implements IConnectionService {
    constructor(@inject(IConnectionManager) private readonly _connectionManager: IConnectionManager) { }

    create(id: string, expenseId: string): Promise<IConnection> {
        return this._connectionManager.createConnection(id, expenseId);
    }

    refreshTtl(id: string): Promise<IConnection> {
        return this._connectionManager.refreshTtl(id);
    }

    delete(id: string): Promise<void> {
        return this._connectionManager.deleteConnection(id);
    }

    deleteExpired(): Promise<void> {
        return this._connectionManager.deleteExpired();
    }

    getRelatedConnections(connectionId: string): Promise<string[]> {
        return this._connectionManager.getRelatedConnections(connectionId);
    }

    getExpenseIdForConnection(connectionId: string): Promise<string> {
        return this._connectionManager.getExpenseIdForConnection(connectionId);
    }

    getConnectionsForExpenseId(expenseId: string): Promise<string[]> {
        return this._connectionManager.getConnectionsForExpenseId(expenseId);
    }
    
    generateConnectionToken(expenseId: string): Promise<string> {
        return this._connectionManager.generateConnectionToken(expenseId);
    }

    verifyConnectionToken(token: string, expenseId: string): Promise<boolean> {
        return this._connectionManager.verifyConnectionToken(token, expenseId);
    }
}
