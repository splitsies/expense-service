import { IExpenseDto } from "@splitsies/shared-models";
import { IConnection } from "../connection/connection-interface";

export interface IExpensePublishRequest {
    readonly expenseDto: IExpenseDto;
    readonly connection: IConnection;
}