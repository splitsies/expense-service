import { IExpenseDto, IExpenseItem } from "@splitsies/shared-models";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDtoMapper {
    toDto(expense: IExpenseDa, userIds: string[], items: IExpenseItem[]): IExpenseDto;
    fromUpdate(expenseUpdate: IExpenseUpdate): IExpenseDto;
}
export const IExpenseDtoMapper = Symbol.for("IExpenseDtoMapper");