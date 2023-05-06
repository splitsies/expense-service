export interface IUserExpenseStatements {
    readonly GetExpenseIdsForUser: string;
}
export const IUserExpenseStatements = Symbol.for("IUserExpenseStatements");
