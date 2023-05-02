import { IDao } from "@splitsies/utils";
import { IConnection } from "src/models/connection/connection-interface";

export interface IConnectionDao extends IDao<IConnection> {
    getExpenseIdForConnection(connectionId: string): Promise<string>;
    getConnectionsForExpense(expenseId: string): Promise<string[]>;
    deleteExpiredConnections(): Promise<string[]>;
}
export const IConnectionDao = Symbol.for("IConnectionDao");
