import { DaoBase, ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { IUserExpenseDao } from "./user-expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IUserExpenseStatements } from "./user-expense-statements-interface";
import { ExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

@injectable()
export class UserExpenseDao extends DaoBase<IUserExpense> implements IUserExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IUserExpenseStatements) private readonly _statements: IUserExpenseStatements,
    ) {
        super(logger, dbConfiguration, dbConfiguration.userExpenseTableName, (e) => ({
            expenseId: e.expenseId,
            userId: e.userId,
        }));
    }

    async getExpenseIdsForUser(userId: string): Promise<string[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetExpenseIdsForUser,
                Parameters: [{ S: userId }],
            }),
        );

        return result.Items?.length ? result.Items.map((i) => (unmarshall(i) as IUserExpense).expenseId) : [];
    }
}
