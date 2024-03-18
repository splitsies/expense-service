import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IExpenseStatements } from "./expense-statements-interface";

@injectable()
export class ExpenseStatements implements IExpenseStatements {
    readonly GetExpenses: string;

    constructor(@inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        this.GetExpenses = `SELECT * FROM "${dbConfiguration.tableName}"."${dbConfiguration.transactionDateIndexName}" WHERE id IN ? ORDER BY transactionDate,id DESC`;
    }
}
