import { IConnection } from "src/models/connection/connection-interface";

export interface IConnectionService {
    create(id: string, expenseId: string): Promise<IConnection>;
    refreshTtl(id: string): Promise<IConnection>;
    delete(id: string): Promise<void>;
    getRelatedConnections(connectionId: string): Promise<string[]>;
    getExpenseIdForConnection(connectionId: string): Promise<string>;
}

export const IConnectionService = Symbol.for("IConnectionService");
