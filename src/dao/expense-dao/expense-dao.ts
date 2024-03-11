import { inject, injectable } from "inversify";
import { IExpense, IExpenseDto, IExpenseMapper } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { ExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IExpenseStatements } from "./expense-statements-interface";

@injectable()
export class ExpenseDao extends DaoBase<IExpense, IExpenseDto> implements IExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IExpenseMapper) mapper: IExpenseMapper,
        @inject(IExpenseStatements) private readonly _expenseStatements: IExpenseStatements,
    ) {
        const keySelector = (e: IExpense) => ({ id: e.id });
        super(logger, dbConfiguration, dbConfiguration.tableName, keySelector, mapper);
    }

    async getExpenses(expenseIds: string[]): Promise<IExpense[]> {
        if (expenseIds.length === 0) return [];

        const placeholders = `[${expenseIds.map((_) => "?").join(",")}]`;
        const statement = this._expenseStatements.GetExpenses.replace("?", placeholders);
        const result = await this._client.send(
            new ExecuteStatementCommand({
                Statement: statement,
                Parameters: expenseIds.map((id) => ({ S: id })),
            }),
        );

        return result.Items?.length
            ? result.Items.map((i) => this._mapper.toDomainModel(unmarshall(i) as IExpenseDto))
            : [];
    }
}
