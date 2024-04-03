import { IUserExpense } from "./user-expense-interface";

export class UserExpense implements IUserExpense {
    constructor(
        readonly expenseId: string,
        readonly userId: string,
        readonly pendingJoin: boolean,
        readonly requestingUserId?: string,
        readonly createdAt?: Date,
    ) {}
}
