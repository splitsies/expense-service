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
        @inject(IExpenseMapper) private readonly _mapper: IExpenseMapper,
        @inject(IExpenseStatements) private readonly _expenseStatements: IExpenseStatements,
    ) {
        const keySelector = (e: IExpense) => ({ id: e.id });
        super(logger, dbConfiguration, dbConfiguration.tableName, keySelector, _mapper);
    }

    async getExpenses(expenseIds: string[]): Promise<IExpense[]> {
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
