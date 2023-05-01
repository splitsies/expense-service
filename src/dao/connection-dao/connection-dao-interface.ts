import { IConnection } from "src/models/connection/connection-interface";
import { IDao } from "../dao-interface";

export interface IConnectionDao extends IDao<IConnection, string> {
    getExpenseIdForConnection(connectionId: string): Promise<string>;
    getConnectionsForExpense(expenseId: string): Promise<string[]>;
    deleteExpiredConnections(): Promise<string[]>;
}
export const IConnectionDao = Symbol.for("IConnectionDao");
