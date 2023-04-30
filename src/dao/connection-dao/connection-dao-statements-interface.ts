export interface IConnectionDaoStatements {
    readonly GetExpenseIdForConnection: string;
    readonly GetConnectionIdsForExpense: string;
    readonly GetExpiredConnectionIds: string;
}

export const IConnectionDaoStatements = Symbol.for("IConnectionDaoStatements");
