import { inject, injectable } from "inversify";
import { IConnectionDaoStatements } from "./connection-dao-statements-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";

@injectable()
export class ConnectionDaoStatements implements IConnectionDaoStatements {
    readonly GetExpenseIdForConnection: string;
    readonly GetConnectionsForExpense: string;
    readonly GetExpiredConnections: string;
    readonly GetByConnectionId: string;

    constructor(@inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        const table = dbConfiguration.connectionTableName;
        this.GetConnectionsForExpense = `SELECT * FROM "${table}"."ExpenseIndex" WHERE expenseId = ? AND ttl >= ?`;
        this.GetExpenseIdForConnection = `SELECT expenseId FROM "${table}" WHERE connectionId = ? AND ttl >= ?`;
        this.GetExpiredConnections = `SELECT * FROM "${table}" WHERE ttl < ?`;
        this.GetByConnectionId = `SELECT * FROM "${table}" WHERE connectionId = ?`;
    }
}
