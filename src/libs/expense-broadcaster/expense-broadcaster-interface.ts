import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnection } from "src/models/connection/connection-interface";

export interface IExpenseBroadcaster {
    broadcast(expense: ExpenseMessage, ignoredConnectionIds?: string[]): Promise<void>;
    notify(expense: ExpenseMessage, connection: IConnection): Promise<void>;
}
export const IExpenseBroadcaster = Symbol.for("IExpenseBroadcaster");
