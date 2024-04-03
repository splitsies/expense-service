import { IExpenseDa } from "./expense-da-interface";

export class ExpenseDa implements IExpenseDa {
    constructor(readonly id: string, readonly name: string, readonly transactionDate: Date) {}
}
