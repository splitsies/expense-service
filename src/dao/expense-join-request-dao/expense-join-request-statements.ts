import { inject, injectable } from "inversify";
import { IExpenseJoinRequestStatements } from "./expense-join-request-statements-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";

@injectable()
export class ExpenseJoinRequestStatements implements IExpenseJoinRequestStatements {
    readonly GetForUser: string;
    readonly GetForExpense: string;

    constructor(@inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        this.GetForUser = `SELECT * FROM "${dbConfiguration.expenseJoinRequestTableName}" WHERE userId = ?`;
        this.GetForExpense = `SELECT * FROM "${dbConfiguration.expenseJoinRequestTableName}" WHERE expenseId = ?`;
    }
}