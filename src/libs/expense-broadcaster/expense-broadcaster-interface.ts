import { IExpenseMessage } from "@splitsies/shared-models";

export interface IExpenseBroadcaster {
    broadcast(expenseId: string, message: IExpenseMessage): Promise<void>;
}
export const IExpenseBroadcaster = Symbol.for("IExpenseBroadcaster");
