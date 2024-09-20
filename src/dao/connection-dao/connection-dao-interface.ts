import { IDao } from "@splitsies/utils";
import { IConnection, Key } from "src/models/connection/connection-interface";

export interface IConnectionDao extends IDao<IConnection, Key> {
    getExpenseIdForConnection(connectionId: string): Promise<string>;
    getConnectionsForExpense(expenseId: string): Promise<IConnection[]>;
    deleteExpiredConnections(): Promise<string[]>;
}
export const IConnectionDao = Symbol.for("IConnectionDao");
