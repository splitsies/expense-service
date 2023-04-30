export interface IConnectionDaoStatements {
    readonly GetExpenseIdForConnection: string;
    readonly GetConnectionIdsForExpense: string;
    readonly GetExpiredConnectionIds: string;
    readonly GetByConnectionId: string;
}

export const IConnectionDaoStatements = Symbol.for("IConnectionDaoStatements");
