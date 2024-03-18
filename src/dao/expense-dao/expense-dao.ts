import { inject, injectable } from "inversify";
import { IExpense, IExpenseDto, IExpenseMapper } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { ExecuteStatementCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IExpenseStatements } from "./expense-statements-interface";

@injectable()
export class ExpenseDao extends DaoBase<IExpense, IExpenseDto> implements IExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) private readonly _dbConfiguration: IDbConfiguration,
        @inject(IExpenseMapper) mapper: IExpenseMapper,
        @inject(IExpenseStatements) private readonly _expenseStatements: IExpenseStatements,
    ) {
        const keySelector = (e: IExpense) => ({ id: e.id });
        super(logger, _dbConfiguration, _dbConfiguration.tableName, keySelector, mapper);
    }

    async getExpenses(expenseIds: string[]): Promise<IExpense[]> {
        if (expenseIds.length === 0) return [];

        const expenses: IExpense[] = [];
        let nextToken = "";
        const placeholders = `[${expenseIds.map((_) => "?").join(",")}]`;
        const statement = this._expenseStatements.GetExpenses.replace("?", placeholders);
        const timeout = Date.now() + 10000;
        do {
            const result = await this._client.send(
                new ExecuteStatementCommand({
                    NextToken: nextToken || undefined,
                    Statement: statement,
                    Parameters: expenseIds.map((id) => ({ S: id })),
                }),
            );

            if (result.Items?.length) {
                expenses.push(...result.Items.map((i) => this._mapper.toDomainModel(unmarshall(i) as IExpenseDto)));
            }
            nextToken = result.NextToken;
        } while (nextToken && Date.now() < timeout);
        return expenses;
    }
}
