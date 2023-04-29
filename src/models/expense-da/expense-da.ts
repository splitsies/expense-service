import { IExpenseItem } from "@splitsies/shared-models";
import { IExpenseDa } from "./expense-da-interface";

export class ExpenseDa implements IExpenseDa {
    constructor(
        readonly id: string,
        readonly name: string,
        readonly transactionDate: string,
        readonly items: IExpenseItem[],
        readonly proportionalItems: IExpenseItem[],
    ) {}
}
