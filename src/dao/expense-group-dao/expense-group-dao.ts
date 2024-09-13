import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";
import postgres, { Sql } from "postgres";
import { ExpenseGroupDa } from "src/models/expense-group-da";
import { IExpenseGroupDao } from "./expense-group-dao-interface";
import { IPgProvider } from "src/providers/pg-provider.i";

@injectable()
export class ExpenseGroupDao implements IExpenseGroupDao {
    private readonly _client: Sql;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) _dbConfiguration: IDbConfiguration,
        @inject(IPgProvider) private readonly _pgProvider: IPgProvider,
    ) {
        this._client = this._pgProvider.provide();
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

    async read(key: { parentExpenseId: string; childExpenseId: string }): Promise<ExpenseGroupDa> {
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

    async delete(key: { parentExpenseId: string; childExpenseId: string }): Promise<void> {
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
