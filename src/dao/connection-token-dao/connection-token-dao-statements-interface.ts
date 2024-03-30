export interface IConnectionTokenDaoStatements {
    readonly GetExpiredConnections: string;
}

export const IConnectionTokenDaoStatements = Symbol.for("IConnectionTokenDaoStatements");
