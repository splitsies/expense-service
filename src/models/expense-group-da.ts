export class ExpenseGroupDa {
    constructor(
        readonly parentExpenseId: string,
        readonly childExpenseId: string
    ) { }
}