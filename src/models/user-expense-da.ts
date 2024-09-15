export class UserExpenseDa {
    constructor(
        readonly expenseId: string,
        readonly userId: string,
        readonly pendingJoin: boolean,
        readonly requestingUserId?: string,
        readonly createdAt?: string,
    ) {}
}

export type Key = Pick<UserExpenseDa, "expenseId" | "userId">;
