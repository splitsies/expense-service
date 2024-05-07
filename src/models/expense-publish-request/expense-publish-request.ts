import { IExpenseDto } from "@splitsies/shared-models";
import { IConnection } from "../connection/connection-interface";
import { IExpensePublishRequest } from "./expense-publish-request-interface";

export class ExpensePublishRequest implements IExpensePublishRequest {
    constructor(readonly expenseDto: IExpenseDto, readonly connection: IConnection) {}
}
