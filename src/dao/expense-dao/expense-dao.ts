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

    async getExpensesForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IExpenseDa>> {
        const res = await this._client<IExpenseDa[]>`
            SELECT e.*
              FROM "Expense" e
              JOIN "UserExpense" ue
                ON e."id" = ue."expenseId"
         LEFT JOIN "ExpenseGroup" eg
                ON eg."childExpenseId" = e."id"
             WHERE ue."userId" = ${userId}
               AND ue."pendingJoin" = FALSE
               AND eg."parentExpenseId" IS NULL
          ORDER BY e."transactionDate" DESC
             LIMIT ${limit} OFFSET ${offset}
        `;

        const scan = new ScanResult<IExpenseDa>(res, { nextPage: { limit, offset: offset + (res?.length ?? 0) } });
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

    async getChildExpenseIds(parentExpenseId: string): Promise<string[]> {
        const res = await this._client<{ childExpenseId: string }[]>`
            SELECT "childExpenseId"
              FROM "ExpenseGroup"         
             WHERE "parentExpenseId" = ${parentExpenseId};
        `;


        return res.length ? res.map(r => r.childExpenseId) : [];
    }
}
