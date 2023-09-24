import { inject, injectable } from "inversify";
import { IExpense, IExpenseDto } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, IExpenseMapper, ILogger } from "@splitsies/utils";
import { ExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

@injectable()
export class ExpenseDao extends DaoBase<IExpense, IExpenseDto> implements IExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) private readonly dbConfiguration: IDbConfiguration,
        @inject(IExpenseMapper) mapper: IExpenseMapper,
    ) {
        const keySelector = (e: IExpense) => ({ id: e.id });
        super(logger, dbConfiguration, dbConfiguration.tableName, keySelector, mapper);
    }

    async getExpensesForUser(userId: string): Promise<IExpense[]> {
        // TODO: Remove and use the UserExpenseDao
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: `SELECT * FROM "${this.dbConfiguration.tableName}"`,
            }),
        );

        return result.Items?.length ? result.Items.map((i) => unmarshall(i) as IExpense) : [];
    }
}
