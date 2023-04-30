import { IExpenseItem } from "@splitsies/shared-models";
import { IExpenseDto } from "./expense-dto-interface";

export class ExpenseDto implements IExpenseDto {
    constructor(
        readonly id: string,
        readonly name: string,
        readonly transactionDate: string,
        readonly items: IExpenseItem[],
        readonly proportionalItems: IExpenseItem[],
    ) {}
}
