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
            idle_timeout: _dbConfiguration.pgIdleTimeoutSec,
            max_lifetime: _dbConfiguration.pgMaxLifetimeSec,
            max: _dbConfiguration.pgMaxConnections,
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

    async getParentExpenseId(childExpenseId: string): Promise<string | undefined> {
        const res = await this._client<{ parentExpenseId: string }[]>`
            SELECT "parentExpenseId"
              FROM "ExpenseGroup"
             WHERE "childExpenseId" = ${childExpenseId};
        `;

        return res.length ? res[0].parentExpenseId : undefined;
    }

    async getChildExpenseIds(parentExpenseId: string): Promise<string[]> {
        const res = await this._client<{ childExpenseId: string }[]>`
            SELECT "childExpenseId"
              FROM "ExpenseGroup"         
             WHERE "parentExpenseId" = ${parentExpenseId};
        `;

        return res.length ? res.map((r) => r.childExpenseId) : [];
    }
}
