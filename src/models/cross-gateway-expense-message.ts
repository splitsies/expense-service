import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnection } from "./connection/connection-interface";

export class CrossGatewayExpenseMessage {
    constructor(readonly message: ExpenseMessage, readonly connection: IConnection) {}
}
