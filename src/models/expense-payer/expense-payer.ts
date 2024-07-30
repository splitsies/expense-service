import { IExpensePayer } from "./expense-payer-interface";

export class ExpensePayer implements IExpensePayer {
    constructor(
        readonly expenseId: string,
        readonly userId: string,
        readonly share: number,
    ) { }
};