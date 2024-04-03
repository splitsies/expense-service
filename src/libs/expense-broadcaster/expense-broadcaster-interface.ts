import { IExpenseDto } from "@splitsies/shared-models";

export interface IExpenseBroadcaster {
    broadcast(expense: IExpenseDto): Promise<void>;
    notify(expense: IExpenseDto): Promise<void>;
}
export const IExpenseBroadcaster = Symbol.for("IExpenseBroadcaster");
