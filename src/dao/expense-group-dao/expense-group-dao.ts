import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";
import postgres, { Sql } from "postgres";
import { ExpenseGroupDa } from "src/models/expense-group-da";
import { IExpenseGroupDao } from "./expense-group-dao-interface";

@injectable()
export class ExpenseGroupDao implements IExpenseGroupDao {
    private readonly _client: Sql;

    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) _dbConfiguration: IDbConfiguration) {
        this._client = postgres({
            hostname: _dbConfiguration.pgHost,
            port: _dbConfiguration.pgPort,
            database: _dbConfiguration.pgDatabaseName,
        });
    }

    async create(model: ExpenseGroupDa): Promise<ExpenseGroupDa> {
        const res = await this._client<ExpenseGroupDa[]>`
            INSERT INTO "ExpenseGroup"
                ("parentExpenseId", "childExpenseId")
            VALUES
                (${model.parentExpenseId}, ${model.childExpenseId}) 
            RETURNING *;
        `;

        return res[0];
    }

    async read(key: Record<string, string | number>): Promise<ExpenseGroupDa> {
        const res = await this._client<ExpenseGroupDa[]>`
            SELECT *
              FROM "ExpenseGroup"
             WHERE "parentExpenseId" = ${key.parentExpenseId}
               AND "childExpenseId" = ${key.childExpenseId};
        `;

        return res.length ? res[0] : undefined;
    }

    async update(updated: ExpenseGroupDa): Promise<ExpenseGroupDa> {
        const res = await this._client<ExpenseGroupDa[]>`
            UPDATE "ExpenseGroup"
               SET "childExpenseId" = ${updated.childExpenseId}
             WHERE "parentExpenseId" = ${updated.parentExpenseId}
             RETURNING *
        `;

        return res.length ? res[0] : undefined;
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client`
            DELETE FROM "ExpenseGroup"
            WHERE "parentExpenseId" = ${key.parentExpenseId}
              AND "childExpenseId" = ${key.childExpenseId};
        `;
    }
}
