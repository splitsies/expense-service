import { ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { IUserExpenseDao } from "./user-expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import postgres, { Sql } from "postgres";
import { IScanResult, ScanResult } from "@splitsies/shared-models";

@injectable()
export class UserExpenseDao implements IUserExpenseDao {
    private readonly _client: Sql;

    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        const keySelector = (e: IUserExpense) => ({ expenseId: e.expenseId, userId: e.userId });
        this.key = keySelector;
        this._client = postgres({
            hostname: dbConfiguration.pgHost,
            port: dbConfiguration.pgPort,
            database: dbConfiguration.pgDatabaseName,
        });
    }
    key: (model: IUserExpense) => Record<string, string | number>;

    async create(model: IUserExpense): Promise<IUserExpense> {
        const res = await this._client<IUserExpense[]>`
            INSERT INTO "UserExpense"
                ("expenseId", "userId", "pendingJoin", "requestingUserId", "createdAt")
            VALUES
                (${model.expenseId}, ${model.userId}, ${!!model.pendingJoin}, ${model.requestingUserId ?? null}, ${
            model.createdAt ?? null
        }) 
            RETURNING *;
        `;

        return res.length ? res[0] : undefined;
    }

    async read(key: Record<string, string | number>): Promise<IUserExpense> {
        const id = key.expenseId;
        const userId = key.userId;

        const res = await this._client<IUserExpense[]>`
            SELECT *
              FROM "UserExpense"
             WHERE "expenseId" = ${id} 
               AND "userId" = ${userId};
        `;

        return res.length ? res[0] : undefined;
    }

    async update(updated: IUserExpense): Promise<IUserExpense> {
        const res = await this._client<IUserExpense[]>`
            UPDATE "UserExpense"
               SET "pendingJoin" = ${updated.pendingJoin}
             WHERE "expenseId" = ${updated.expenseId}
               AND "userId" = ${updated.userId}
            RETURNING *;
        `;

        return res.length ? res[0] : undefined;
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client<IUserExpense[]>`
            DELETE FROM "UserExpense"
             WHERE "expenseId" = ${key.expenseId}
               AND "userId" = ${key.userId};
        `;
    }

    async getForUser(userId: string): Promise<IUserExpense[]> {
        const res = await this._client<IUserExpense[]>`
            SELECT *
              FROM "UserExpense"
             WHERE "userId" = ${userId};
        `;

        return res.length ? res : [];
    }

    async getExpenseIdsForUser(userId: string): Promise<string[]> {
        const res = await this._client<{ expenseId: string }[]>`        
            SELECT "expenseId" FROM "UserExpense"
             WHERE "userId" = ${userId}
             AND "pendingJoin" = FALSE;
        `;

        return res.length ? res.map((u) => u.expenseId) : [];
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        const res = await this._client<{ userId: string }[]>`
            SELECT "userId" FROM "UserExpense"
             WHERE "expenseId" = ${expenseId};
        `;

        return res.length ? res.map((u) => u.userId) : [];
    }

    async getJoinRequestsForUser(userId: string, limit: number, offset: number): Promise<IScanResult<IUserExpense>> {
        const res = await this._client<IUserExpense[]>`
            SELECT *
              FROM "UserExpense"
             WHERE "userId" = ${userId}
               AND "pendingJoin" = TRUE;
          ORDER BY "createdAt" DESC
             LIMIT ${limit}
            OFFSET ${offset}
        `;

        const scan = new ScanResult<IUserExpense>(res, { nextPage: { limit, offset: offset + (res?.length ?? 0) } });
        return scan;
    }

    async getJoinRequestsForExpense(expenseId: string): Promise<IUserExpense[]> {
        const res = await this._client<IUserExpense[]>`
            SELECT *
              FROM "UserExpense"
             WHERE "expenseId" = ${expenseId}
               AND "pendingJoin" = TRUE;
        `;

        return res.length ? res : [];
    }

    async deleteForUser(userId: string): Promise<void> {
        await this._client`
            DELETE FROM "UserExpense"
                  WHERE "userId" = ${userId};
        `;
    }
}
