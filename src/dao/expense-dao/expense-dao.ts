import { inject, injectable } from "inversify";
import { IExpense, IExpenseMapper } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";
import { IExpenseStatements } from "./expense-statements-interface";
import postgres, { Sql } from "postgres";
import { IExpenseDa } from "src/models/expense/expense-da-interface";

@injectable()
export class ExpenseDao implements IExpenseDao {

    private readonly _client: Sql;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) private readonly _dbConfiguration: IDbConfiguration,
        @inject(IExpenseMapper) mapper: IExpenseMapper,
        @inject(IExpenseStatements) private readonly _expenseStatements: IExpenseStatements,
    ) {    
        this._client = postgres({ user: "postgres", password: "postgres", hostname: "127.0.0.1", port: 5432 });        
    }

    async create(model: IExpense): Promise<IExpense> {
        const res = await this._client<IExpense[]>`
            INSERT INTO expense
                (id, name, transactionDate)
            VALUES
                (${model.id}, ${model.name}, ${model.transactionDate}) 
            RETURNING *;
        `;

        return model;
    }

    async read(key: Record<string, string | number>): Promise<IExpense> {
        const id = key.id;
        const res = await this._client<IExpense[]>`
            SELECT *
              FROM Expense
             WHERE id = ${id};
        `;

        return res.length ? res[0] : undefined;
    }
    
    update(updated: IExpense): Promise<IExpense> {
        throw new Error("Method not implemented.");
    }

    delete(key: Record<string, string | number>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getExpensesForUser(userId: string): Promise<IExpenseDa[]> {
        const res = await this._client<IExpenseDa[]>`
            SELECT e.* FROM Expense e, UserExpense ue
              WHERE e.id = ue.expenseId
                AND ue.userId = ${userId}
            ORDER BY e.transactionDate DESC;
        `;

        return res.length ? res : [];
    }

    async getExpenses(expenseIds: string[]): Promise<IExpense[]> {
        const res = await this._client<IExpense[]>`
            SELECT * FROM Expense WHERE id IN (${expenseIds.join(",")}) ORDER BY transactionDate DESC
        `;

        return res.length ? res : [];
    }
}
