import { injectable } from "inversify";
import { IExpenseMapper } from "./expense-mapper-interface";
import { Expense, IExpense } from "@splitsies/shared-models";
import { IExpenseDto } from "src/models/expense-dto/expense-dto-interface";
import { ExpenseDto } from "src/models/expense-dto/expense-dto";

@injectable()
export class ExpenseMapper implements IExpenseMapper {
    toDtoModel(expense: IExpense): IExpenseDto {
        return new ExpenseDto(
            expense.id,
            expense.name,
            expense.transactionDate.toISOString(),
            expense.items,
            expense.proportionalItems,
        );
    }

    toDomainModel(expenseDto: IExpenseDto): IExpense {
        return new Expense(
            expenseDto.id,
            expenseDto.name,
            new Date(Date.parse(expenseDto.transactionDate)),
            expenseDto.items,
            expenseDto.proportionalItems,
        );
    }
}
