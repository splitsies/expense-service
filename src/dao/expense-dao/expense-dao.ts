import { inject, injectable } from "inversify";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";
import postgres, { Sql } from "postgres";
import { IExpenseDa } from "src/models/expense/expense-da-interface";
import { IScanResult, ScanResult } from "@splitsies/shared-models";

@injectable()
export class ExpenseDao implements IExpenseDao {
    private readonly _client: Sql;

    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) _dbConfiguration: IDbConfiguration) {
        this._client = postgres({
            hostname: _dbConfiguration.pgHost,
            port: _dbConfiguration.pgPort,
            database: _dbConfiguration.pgDatabaseName,
        });
    }

    async create(model: IExpenseDa): Promise<IExpenseDa> {
        const res = await this._client<IExpenseDa[]>`
            INSERT INTO "Expense"
                ("id", "name", "transactionDate")
            VALUES
                (${model.id}, ${model.name}, ${model.transactionDate}) 
            RETURNING *;
        `;

        return res[0];
    }

    async read(key: Record<string, string | number>): Promise<IExpenseDa> {
        const id = key.id;
        const res = await this._client<IExpenseDa[]>`
            SELECT *
              FROM "Expense"
             WHERE "id" = ${id};
        `;

        return res.length ? res[0] : undefined;
    }

    async update(updated: IExpenseDa): Promise<IExpenseDa> {
        const res = await this._client<IExpenseDa[]>`
            UPDATE "Expense"
               SET "transactionDate" = ${updated.transactionDate},
                   "name" = ${updated.name}                   
             WHERE "id" = ${updated.id}
             RETURNING *
        `;

        return res.length ? res[0] : undefined;
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client`
            DELETE FROM "Expense"
            WHERE id = ${key.id};
        `;
    }

    async getExpensesForUser(userId: string, lastEvaluatedKey: { id: string, transactionDate: string } = undefined): Promise<IScanResult<IExpenseDa>> {
        const res = !lastEvaluatedKey ? await this._client<IExpenseDa[]>`
            SELECT e.*
              FROM "Expense" e, "UserExpense" ue
             WHERE e."id" = ue."expenseId"
               AND ue."userId" = ${userId}
               AND ue."pendingJoin" = FALSE
          ORDER BY e."transactionDate" DESC
             LIMIT 5;
        ` : await this._client<IExpenseDa[]>`
            SELECT e.*
                FROM "Expense" e, "UserExpense" ue
            WHERE e."id" = ue."expenseId"
                AND ue."userId" = ${userId}
                AND ue."pendingJoin" = FALSE
                AND e."id" != ${lastEvaluatedKey.id}
                AND e."transactionDate" < ${lastEvaluatedKey.transactionDate}
            ORDER BY e."transactionDate" DESC
            LIMIT 5;
        `;

        const { id, transactionDate } = res[res.length - 1];
        const scan = new ScanResult<IExpenseDa>(res, { LastEvaluatedKey: { id, transactionDate } });
        return scan;
    }

    async getExpenses(expenseIds: string[]): Promise<IExpenseDa[]> {
        const res = await this._client<IExpenseDa[]>`
            SELECT *
              FROM "Expense"
             WHERE "id" IN (${expenseIds.join(",")}) 
          ORDER BY "transactionDate" DESC
        `;

        return res.length ? res : [];
    }
}
