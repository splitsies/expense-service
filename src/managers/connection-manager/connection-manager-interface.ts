import { IConnection } from "src/models/connection/connection-interface";

export interface IConnectionManager {
    createConnection(connectionId: string, expenseId: string): Promise<IConnection>;
    refreshTtl(connectionId: string): Promise<IConnection>;
    deleteConnection(connectionId: string): Promise<void>;
    deleteExpired(): Promise<void>;
    getRelatedConnections(connectionId: string): Promise<string[]>;
    getExpenseIdForConnection(connectionId: string): Promise<string>;
    getConnectionsForExpenseId(expenseId: string): Promise<string[]>;
}

export const IConnectionManager = Symbol.for("IConnectionManager");
