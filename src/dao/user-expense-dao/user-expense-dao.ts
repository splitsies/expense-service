import { ILogger } from "@splitsies/utils";
import { inject, injectable } from "inversify";
import { IUserExpense } from "src/models/user-expense/user-expense-interface";
import { IUserExpenseDao } from "./user-expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { IUserExpenseStatements } from "./user-expense-statements-interface";
import postgres, { Sql } from "postgres";

@injectable()
export class UserExpenseDao implements IUserExpenseDao {
    private readonly _client: Sql;

    constructor(
        @inject(ILogger) logger: ILogger,
        @inject(IDbConfiguration) dbConfiguration: IDbConfiguration,
        @inject(IUserExpenseStatements) private readonly _statements: IUserExpenseStatements,
    ) {
        const keySelector = (e: IUserExpense) => ({ expenseId: e.expenseId, userId: e.userId });
        this.key = keySelector;
        this._client = postgres({ user: "postgres", password: "postgres", hostname: "127.0.0.1", port: 5432 });
    }
    key: (model: IUserExpense) => Record<string, string | number>;

    async create(model: IUserExpense): Promise<IUserExpense> {

        const res = await this._client<IUserExpense[]>`
            INSERT INTO UserExpense (expenseId, userId, pendingJoin) VALUES (${model.expenseId}, ${model.userId}, ${!!model.pendingJoin}) RETURNING *
        `;

        console.log({ res });
        return res.length ? res[0] : undefined;
    }

    async read(key: Record<string, string | number>): Promise<IUserExpense> {
        const id = key.expenseId;
        const userId = key.userId;

        const res = await this._client<IUserExpense[]>`
            SELECT * FROM UserExpense WHERE expenseId = ${id} AND userId = ${userId};
        `;

        console.log({ res });
        return res.length ? res[0] : undefined;
    }

    async update(updated: IUserExpense): Promise<IUserExpense> {
        const res = await this._client<IUserExpense[]>`
            UPDATE UserExpense
               SET pendingJoin = ${updated.pendingJoin}
             WHERE expenseId = ${updated.expenseId}
               AND userId = ${updated.userId}
            RETURNING *;
        `;

        return res.length ? res[0] : undefined;
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client<IUserExpense[]>`
            DELETE FROM UserExpense
             WHERE expenseId = ${key.expenseId}
               AND userId = ${key.userId};
        `;
    }

    async getForUser(userId: string): Promise<IUserExpense[]> {
        const res = await this._client<IUserExpense[]>`
            SELECT * FROM UserExpense
             WHERE userId = ${userId};
        `;

        return res.length ? res : [];
    }

    async getExpenseIdsForUser(userId: string): Promise<string[]> {

        const res = await this._client<{ expenseId: string }[]>`        
            SELECT expenseId as "expenseId" FROM UserExpense
             WHERE userId = ${userId}
             AND pendingJoin = FALSE;
        `;

        return res.length ? res.map(u => u.expenseId) : [];
    }

    async getUsersForExpense(expenseId: string): Promise<string[]> {
        const res = await this._client<{ userId: string }[]>`
            SELECT userId as "userId" FROM UserExpense
             WHERE expenseId = ${expenseId};
        `;

        return res.length ? res.map(u => u.userId) : [];
    }
}
