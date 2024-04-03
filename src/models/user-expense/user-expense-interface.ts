export interface IUserExpense {
    readonly expenseId: string;
    readonly userId: string;
    readonly pendingJoin: boolean;
    readonly requestingUserId?: string;
    readonly createdAt?: Date;
}
