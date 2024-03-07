import { ExpenseOperation, IExpense, IExpenseMessageParameters } from "@splitsies/shared-models";

export interface IExpenseMessageStrategy {
    execute(operationName: ExpenseOperation, params: IExpenseMessageParameters): Promise<IExpense>;
}
export const IExpenseMessageStrategy = Symbol.for("IExpenseMessageStrategy");
