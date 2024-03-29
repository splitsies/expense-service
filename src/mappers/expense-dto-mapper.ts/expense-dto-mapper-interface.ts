import { IExpenseDto, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDtoMapper {
    toDto(expense: IExpenseDa, userIds: string[], items: IExpenseItem[]): IExpenseDto;
}
export const IExpenseDtoMapper = Symbol.for("IExpenseDtoMapper");