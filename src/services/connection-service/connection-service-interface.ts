import { IConnection } from "src/models/connection/connection-interface";

export interface IConnectionService {
    create(id: string, expenseId: string): Promise<IConnection>;
    refreshTtl(id: string): Promise<IConnection>;
    delete(id: string): Promise<void>;
    deleteExpired(): Promise<void>;
    getRelatedConnections(connectionId: string): Promise<IConnection[]>;
    getExpenseIdForConnection(connectionId: string): Promise<string>;
    getConnectionsForExpenseId(expenseId: string): Promise<IConnection[]>;
    generateConnectionToken(expenseId: string): Promise<string>;
    verifyConnectionToken(token: string, expenseId: string): Promise<boolean>;
}

export const IConnectionService = Symbol.for("IConnectionService");
