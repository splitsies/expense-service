import { injectable } from "inversify";
import { IExpenseMapper } from "./expense-mapper-interface";
import { Expense, IExpense } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense-da/expense-da-interface";
import { ExpenseDa } from "src/models/expense-da/expense-da";

@injectable()
export class ExpenseMapper implements IExpenseMapper {
    toDaModel(expense: IExpense): IExpenseDa {
        return new ExpenseDa(
            expense.id,
            expense.name,
            expense.transactionDate.toISOString(),
            expense.items,
            expense.proportionalItems,
        );
    }

    toDomainModel(expenseDa: IExpenseDa): IExpense {
        return new Expense(
            expenseDa.id,
            expenseDa.name,
            new Date(Date.parse(expenseDa.transactionDate)),
            expenseDa.items,
            expenseDa.proportionalItems,
        );
    }
}
