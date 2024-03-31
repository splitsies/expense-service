import { IExpenseItem, IExpenseDto, ExpenseDto } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { IExpenseDtoMapper } from "./expense-dto-mapper-interface";
import { injectable } from "inversify";
import { IExpenseUpdate } from "src/models/expense-update/expense-update-interface";

@injectable()
export class ExpenseDtoMapper implements IExpenseDtoMapper {
    toDto(expense: IExpenseDa, userIds: string[], items: IExpenseItem[]): IExpenseDto {
        return new ExpenseDto(
            expense.id,
            expense.name,
            expense.transactionDate.toISOString(),
            items,
            userIds);
    }

    fromUpdate(update: IExpenseUpdate): IExpenseDto {
        return new ExpenseDto(update.id, update.name, update.transactionDate, update.items, update.userIds);
    }
}