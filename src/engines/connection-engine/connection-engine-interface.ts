import { IConnection } from "src/models/connection/connection-interface";

export interface IConnectionEngine {
    createConnection(connectionId: string, expenseId: string): Promise<IConnection>;
    refreshTtl(connectionId: string): Promise<IConnection>;
    deleteConnection(connectionId: string): Promise<void>;
    getRelatedConnections(connectionId: string): Promise<string[]>;
    getExpenseIdForConnection(connectionId: string): Promise<string>;
}

export const IConnectionEngine = Symbol.for("IConnectionEngine");
