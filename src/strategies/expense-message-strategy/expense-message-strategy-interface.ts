import { ExpenseOperation, IExpenseDto, IExpenseMessageParameters } from "@splitsies/shared-models";

export interface IExpenseMessageStrategy {
    execute(operationName: ExpenseOperation, params: IExpenseMessageParameters): Promise<IExpenseDto>;
}
export const IExpenseMessageStrategy = Symbol.for("IExpenseMessageStrategy");
