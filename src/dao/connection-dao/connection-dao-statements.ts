import { inject, injectable } from "inversify";
import { IConnectionDaoStatements } from "./connection-dao-statements-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";

@injectable()
export class ConnectionDaoStatements implements IConnectionDaoStatements {
    readonly GetExpenseIdForConnection: string;
    readonly GetConnectionIdsForExpense: string;
    readonly GetExpiredConnectionIds: string;
    readonly GetByConnectionId: string;

    constructor(@inject(IDbConfiguration) _dbConfiguration: IDbConfiguration) {
        const table = _dbConfiguration.connectionTableName;
        this.GetConnectionIdsForExpense = `SELECT connectionId FROM ${table} WHERE expenseId = ?`;
        this.GetExpenseIdForConnection = `SELECT expenseId FROM ${table} WHERE connectionId = ?`;
        this.GetExpiredConnectionIds = `SELECT connectionId, expenseId FROM ${table} WHERE ttl > ?`;
        this.GetByConnectionId = `SELECT * FROM ${table} WHERE connectionId = ?`;
    }
}
