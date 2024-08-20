import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnection } from "../connection/connection-interface";

export interface IExpensePublishRequest {
    readonly message: ExpenseMessage;
    readonly connection: IConnection;
}
