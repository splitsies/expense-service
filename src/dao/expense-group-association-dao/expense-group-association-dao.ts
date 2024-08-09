import { inject, injectable } from "inversify";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import { ILogger } from "@splitsies/utils";
import postgres, { Sql } from "postgres";
import { ExpenseGroupAssociationDa } from "src/models/expense-group-association-da";
import { IExpenseGroupAssociationDao } from "./expense-group-association-dao.i";

@injectable()
export class ExpenseGroupAssociationDao implements IExpenseGroupAssociationDao {
    private readonly _client: Sql;

    constructor(@inject(ILogger) logger: ILogger, @inject(IDbConfiguration) _dbConfiguration: IDbConfiguration) {
        this._client = postgres({
            hostname: _dbConfiguration.pgHost,
            port: _dbConfiguration.pgPort,
            database: _dbConfiguration.pgDatabaseName,
        });
    }

    async create(model: ExpenseGroupAssociationDa): Promise<ExpenseGroupAssociationDa> {
        const res = await this._client<ExpenseGroupAssociationDa[]>`
            INSERT INTO "ExpenseGroupAssociation"
                ("groupId", "expenseId")
            VALUES
                (${model.groupId}, ${model.expenseId}) 
            RETURNING *;
        `;

        return res[0];
    }

    async read(key: Record<string, string | number>): Promise<ExpenseGroupAssociationDa> {
        const res = await this._client<ExpenseGroupAssociationDa[]>`
            SELECT *
              FROM "ExpenseGroupAssociation"
             WHERE "groupId" = ${key.groupId}
               AND "expenseId" = ${key.expenseId};
        `;

        return res.length ? res[0] : undefined;
    }

    async update(_: ExpenseGroupAssociationDa): Promise<ExpenseGroupAssociationDa> {
        throw new Error("Not Implemented for ExpenseGroupAssociation");
    }

    async delete(key: Record<string, string | number>): Promise<void> {
        await this._client`
            DELETE FROM "ExpenseGroup"
            WHERE "groupId" = ${key.groupId}
              AND "expenseId = ${key.expenseId};
        `;
    }

    async getGroupExpenseIds(groupId: string): Promise<string[]> {
        const res = await this._client<{ expenseId: string }[]>`
            SELECT "expenseId"
              FROM "ExpenseGroupAssociation"         
             WHERE "groupId" = ${groupId};
        `;


        return res.length ? res.map(r => r.expenseId) : [];
    }
}
