import { IExpenseItem } from "@splitsies/shared-models/lib/src/expense/expense-item/expense-item-interface";
import { injectable } from "inversify";
import { IExpenseDa } from "../models/expense/expense-da-interface";
import { Expense, IExpense } from "@splitsies/shared-models";
import { IExpenseDaMapper } from "./expense-da-mapper-interface";

@injectable()
export class ExpenseDaMapper implements IExpenseDaMapper {
    fromDa(expenseDa: IExpenseDa, items: IExpenseItem[]): IExpense {
        return new Expense(expenseDa.id, expenseDa.name, expenseDa.transactionDate, items);
    }
}