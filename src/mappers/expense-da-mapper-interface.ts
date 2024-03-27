import { IExpenseItem, IExpense } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

export interface IExpenseDaMapper {
    fromDa(expenseDa: IExpenseDa, items: IExpenseItem[]): IExpense;
}
export const IExpenseDaMapper = Symbol.for("IExpenseDaMapper");