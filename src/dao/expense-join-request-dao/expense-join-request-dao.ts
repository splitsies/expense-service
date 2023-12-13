import { DaoBase, ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IExpenseJoinRequestDao } from "./expense-join-request-dao-interface";
import { IExpenseJoinRequestStatements } from "./expense-join-request-statements-interface";
import { IExpenseJoinRequest } from "@splitsies/shared-models";

@injectable()
export class ExpenseJoinRequestDao extends DaoBase<IExpenseJoinRequest> implements IExpenseJoinRequestDao {
    readonly key: (model: IExpenseJoinRequest) => Record<string, string | number>;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IExpenseJoinRequestStatements) private readonly _statements: IExpenseJoinRequestStatements,
    ) {
        const keySelector = (e: IExpenseJoinRequest) => ({ expenseId: e.expenseId, userId: e.userId });
        super(logger, dbConfiguration, dbConfiguration.expenseJoinRequestTableName, keySelector);
        this.key = keySelector;
    }

    async getForUser(userId: string): Promise<IExpenseJoinRequest[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetForUser,
                Parameters: [{ S: userId }],
            }),
        );

        return result.Items?.length ? result.Items.map((i) => (unmarshall(i) as IExpenseJoinRequest)) : [];
    }

    async getForExpense(expenseId: string): Promise<IExpenseJoinRequest[]> {
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: this._statements.GetForExpense,
                Parameters: [{ S: expenseId }],
            }),
        );

        return result.Items?.length ? result.Items.map((i) => (unmarshall(i) as IExpenseJoinRequest)) : [];
    }
}
