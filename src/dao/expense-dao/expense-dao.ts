import { inject, injectable } from "inversify";
import { IExpense, IExpenseMapper } from "@splitsies/shared-models";
import { IExpenseDao } from "./expense-dao-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";
import {  ILogger } from "@splitsies/utils";
import { IExpenseStatements } from "./expense-statements-interface";
import postgres, { Sql } from "postgres";

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
        const res = await this._client<IExpense[]>`INSERT INTO expense (id, name, transactionDate) VALUES (${model.id}, ${model.name}, ${model.transactionDate}) RETURNING *`;
        console.log({ res })
        return model;

    }

    async read(key: Record<string, string | number>): Promise<IExpense> {
        const id = key.id;
        const res = await this._client<IExpense[]>`SELECT * FROM Expense WHERE id = ${id}`;
        console.log({ res });
        return res.length ? res[0] : undefined;

    }
    update(updated: IExpense): Promise<IExpense> {
        throw new Error("Method not implemented.");
    }
    delete(key: Record<string, string | number>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getExpenses(expenseIds: string[]): Promise<IExpense[]> {
        console.log({ expenseIds });
        // const client = await this._pool.connect();
        const placeholders = `${expenseIds.map((id) => `${id}`).join(",")}`;
        const statement = this._expenseStatements.GetExpenses.replace("?", placeholders);

        console.log({ placeholders });

        console.log({ statement });
        const res = await this._client<IExpense[]>`
            SELECT * FROM Expense WHERE id IN (${expenseIds.join(",")}) ORDER BY transactionDate DESC
        `;
        console.log({ res });
        return res.length ? res : [];

        // const { rows } = await client.query<IExpense>(statement);
        // console.log({ rows });
        return rows;
        // if (expenseIds.length === 0) return [];

        // const expenses: IExpense[] = [];
        // let nextToken = "";
        // const placeholders = `[${expenseIds.map((_) => "?").join(",")}]`;
        // const statement = this._expenseStatements.GetExpenses.replace("?", placeholders);
        // const timeout = Date.now() + 10000;
        // do {
        //     const result = await this._client.send(
        //         new ExecuteStatementCommand({
        //             NextToken: nextToken || undefined,
        //             Statement: statement,
        //             Parameters: expenseIds.map((id) => ({ S: id })),
        //         }),
        //     );

        //     if (result.Items?.length) {
        //         expenses.push(...result.Items.map((i) => this._mapper.toDomainModel(unmarshall(i) as IExpenseDto)));
        //     }
        //     nextToken = result.NextToken;
        // } while (nextToken && Date.now() < timeout);
        // return expenses;
    }
}
