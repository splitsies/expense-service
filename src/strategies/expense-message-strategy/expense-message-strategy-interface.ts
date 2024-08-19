import { ExpenseMessage, ExpenseOperation, IExpenseMessageParameters } from "@splitsies/shared-models";

export interface IExpenseMessageStrategy {
    execute(operationName: ExpenseOperation, params: IExpenseMessageParameters): Promise<ExpenseMessage>;
}
export const IExpenseMessageStrategy = Symbol.for("IExpenseMessageStrategy");
