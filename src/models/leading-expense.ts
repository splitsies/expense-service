export class LeadingExpense {
    constructor(
        readonly userId: string,
        readonly transactionDate: Date,
        readonly expenseId: string,
    ) {}
}