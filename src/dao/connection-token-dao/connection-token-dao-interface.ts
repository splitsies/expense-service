import { IDao } from "@splitsies/utils";
import { IConnection } from "src/models/connection/connection-interface";

export interface IConnectionTokenDao extends IDao<IConnection, { connectionId: string; expenseId: string }> {
    deleteExpired(): Promise<string[]>;
    verify(token: string, expenseId: string): Promise<boolean>;
}
export const IConnectionTokenDao = Symbol.for("IConnectionTokenDao");
