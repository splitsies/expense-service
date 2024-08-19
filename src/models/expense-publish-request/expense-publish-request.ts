import { ExpenseMessage } from "@splitsies/shared-models";
import { IConnection } from "../connection/connection-interface";
import { IExpensePublishRequest } from "./expense-publish-request-interface";

export class ExpensePublishRequest implements IExpensePublishRequest {
    constructor(readonly message: ExpenseMessage, readonly connection: IConnection) {}
}
