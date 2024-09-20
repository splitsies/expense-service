import { inject, injectable } from "inversify";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { DaoBase, ILogger } from "@splitsies/utils";
import { ExpenseDa, Key } from "src/models/expense-da";
import { Expense } from "src/models/expense";
import { IExpenseDaMapper } from "src/mappers/expense-da-mapper-interface";

@injectable()
export class ExpenseDao extends DaoBase<ExpenseDa, Key, Expense> implements IExpenseDao {
    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) _dbConfiguration: IDbConfiguration,
        @inject(IExpenseDaMapper) _mapper: IExpenseDaMapper,
    ) {
        super(logger, _dbConfiguration, _dbConfiguration.expenseTableName, (m) => ({ id: m.id }), _mapper);
    }
}
