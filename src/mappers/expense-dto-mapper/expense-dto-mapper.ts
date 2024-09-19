import { IExpenseItem, IExpenseDto, ExpenseDto, IPayerShare, ExpensePayerStatus } from "@splitsies/shared-models";
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { IExpenseDtoMapper } from "./expense-dto-mapper-interface";
import { injectable } from "inversify";

@injectable()
export class ExpenseDtoMapper implements IExpenseDtoMapper {
    toDto(
        expense: IExpenseDa,
        userIds: string[],
        items: IExpenseItem[],
        payers: IPayerShare[],
        payerStatuses: ExpensePayerStatus[],
        children: IExpenseDto[],
    ): IExpenseDto {
        return new ExpenseDto(
            expense.id,
            expense.name,
            expense.transactionDate.toISOString(),
            items,
            userIds,
            payers,
            payerStatuses,
            children,
        );
    }
}
