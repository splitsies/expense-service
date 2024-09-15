export class ExpenseGroup {
    constructor(readonly parentExpenseId: string, readonly childExpenseId: string) {}
}

export type Key = Pick<ExpenseGroup, "parentExpenseId" | "childExpenseId">;
