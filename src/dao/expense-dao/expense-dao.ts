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
            RETURNING id, name, transactionDate as "transactionDate";
        `;

        return model;
    }

    async read(key: Record<string, string | number>): Promise<IExpense> {
        const id = key.id;
        console.log({ id });
        const res = await this._client<IExpense[]>`
            SELECT id, name, transactionDate as "transactionDate"
              FROM Expense
             WHERE id = ${id};
        `;

        console.log({ readResult: res });

        return res.length ? res[0] : undefined;
    }
    
    async update(updated: IExpense): Promise<IExpense> {
        const res = await this._client<IExpense[]>`
            UPDATE Expense
               SET transactionDate = ${updated.transactionDate},
                   name = ${updated.name}                   
             WHERE id = ${updated.id}
             RETURNING id, name, transactionDate as "transactionDate";
        `;

        return res.length ? res[0] : undefined;
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client`
            DELETE FROM Expense
            WHERE id = ${key.id};
        `;
    }

    async getExpensesForUser(userId: string): Promise<IExpenseDa[]> {
        const res = await this._client<IExpenseDa[]>`
            SELECT e.id, e.name, e.transactionDate as "transactionDate" 
              FROM Expense e, UserExpense ue
             WHERE e.id = ue.expenseId
               AND ue.userId = ${userId}
               AND ue.pendingJoin = FALSE
          ORDER BY e.transactionDate DESC;
        `;

        return res.length ? res : [];
    }

    async getExpenses(expenseIds: string[]): Promise<IExpense[]> {
        const res = await this._client<IExpense[]>`
            SELECT id, name, transactionDate as "transactionDate"
              FROM Expense
             WHERE id IN (${expenseIds.join(",")}) 
          ORDER BY transactionDate DESC
        `;

        return res.length ? res : [];
    }
}
