import { IExpenseDto } from "@splitsies/shared-models";
import { IConnection } from "src/models/connection/connection-interface";

export interface IExpenseBroadcaster {
    broadcast(expense: IExpenseDto, ignoredConnectionIds?: string[]): Promise<void>;
    notify(expense: IExpenseDto, connection: IConnection): Promise<void>;
}
export const IExpenseBroadcaster = Symbol.for("IExpenseBroadcaster");
