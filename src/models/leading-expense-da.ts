export class LeadingExpenseDa {
    constructor(readonly userId: string, readonly transactionDateExpenseId: string) {}
}

export type Key = Pick<LeadingExpenseDa, "userId" | "transactionDateExpenseId">;
