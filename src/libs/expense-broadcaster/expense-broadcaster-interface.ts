import { IExpenseDto, IExpenseMessage } from "@splitsies/shared-models";

export interface IExpenseBroadcaster {
    broadcast(expenseId: string, message: IExpenseMessage): Promise<void>;
    notify(expense: IExpenseDto): Promise<void>;
}
export const IExpenseBroadcaster = Symbol.for("IExpenseBroadcaster");
