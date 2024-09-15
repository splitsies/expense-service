export class ExpenseDa {
    constructor(readonly id: string, readonly name: string, readonly transactionDate: string) {}
}

export type Key = Pick<ExpenseDa, "id">;
