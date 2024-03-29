import { inject, injectable } from "inversify";
import { IUserExpenseStatements } from "./user-expense-statements-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";

@injectable()
export class UserExpenseStatements implements IUserExpenseStatements {
    readonly GetExpenseIdsForUser: string;
    readonly GetUsersForExpense: string;

    constructor(@inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        this.GetExpenseIdsForUser = `SELECT * FROM "${dbConfiguration.userExpenseTableName}" WHERE userId = ?`;
        this.GetUsersForExpense = `SELECT * FROM "${dbConfiguration.userExpenseTableName}" WHERE expenseId = ?`;
    }
}
