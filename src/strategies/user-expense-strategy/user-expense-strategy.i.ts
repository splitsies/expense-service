export interface IUserExpenseStrategy {
    /**
     * Adds a user to an expense.
     * @param userId The id of the user being added
     * @param expenseId The expense to add to
     * @param addToChildren [default=true] Extends the user add to the children (if exists)
     */
    addUserToExpense(userId: string, expenseId: string, addToChildren?: boolean): Promise<void>;

    addUserToChildren(userId: string, expenseId: string): Promise<void>;

    /**
     * Adds a user to expense with the pending join flag checked.
     * @param userId The id of the user being added
     * @param expenseId The **leading** expense id
     * @param requestingUserId The id of the user sending the request
     */
    addUserToExpenseAsJoinRequest(userId: string, expenseId: string, requestingUserId: string): Promise<void>;
    removeUserFromExpense(expenseId: string, userId: string): Promise<void>;
    acceptExpenseJoinRequest(userId: string, expenseId: string): Promise<void>;
}

export const IUserExpenseStrategy = Symbol.for("IUserExpenseStrategy");
