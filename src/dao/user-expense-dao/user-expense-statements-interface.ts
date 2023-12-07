export interface IUserExpenseStatements {
    readonly GetExpenseIdsForUser: string;
    readonly GetUsersForExpense: string;
}
export const IUserExpenseStatements = Symbol.for("IUserExpenseStatements");
