import { IExpenseDto, IExpenseItem, IPayerShare } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDtoMapper {
    toDto(expense: IExpenseDa, userIds: string[], items: IExpenseItem[], payers: IPayerShare[]): IExpenseDto;
}
export const IExpenseDtoMapper = Symbol.for("IExpenseDtoMapper");
