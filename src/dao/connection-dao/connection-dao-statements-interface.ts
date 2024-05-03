export interface IConnectionDaoStatements {
    readonly GetExpenseIdForConnection: string;
    readonly GetConnectionsForExpense: string;
    readonly GetExpiredConnections: string;
    readonly GetByConnectionId: string;
}

export const IConnectionDaoStatements = Symbol.for("IConnectionDaoStatements");
