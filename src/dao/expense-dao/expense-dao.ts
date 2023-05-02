import { inject, injectable } from "inversify";
import { IExpense, IExpenseDto } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, IExpenseMapper, ILogger } from "@splitsies/utils";

@injectable()
export class ExpenseDao extends DaoBase<IExpense, IExpenseDto> implements IExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IExpenseMapper) mapper: IExpenseMapper,
    ) {
        const keySelector = (e: IExpense) => ({ id: e.id });
        super(logger, dbConfiguration, dbConfiguration.tableName, keySelector, mapper);
    }
}
