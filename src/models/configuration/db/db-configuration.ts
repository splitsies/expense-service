import { assert } from "console";
import { IDbConfiguration } from "./db-configuration-interface";
import { injectable } from "inversify";

@injectable()
export class DbConfiguration implements IDbConfiguration {
    private readonly _dbAccessKeyId: string;
    private readonly _dbSecretAccessKey: string;
    private readonly _dbRegion: string;
    private readonly _tableName: string;
    private readonly _connectionTableName: string;
    private readonly _endpoint: string;
    readonly expenseItemTableName: string;
    readonly connectionTokenTableName: string;
    readonly expensePayerTableName: string;
    readonly expensePayerStatusTableName: string;
    readonly expenseTableName: string;
    readonly expenseGroupTableName: string;
    readonly expenseGroupChildIndexName: string;
    readonly userExpenseTableName: string;
    readonly userExpenseUserIndexName: string;
    readonly leadingExpenseTableName: string;

    constructor() {
        assert(!!process.env.dbAccessKeyId, "db access key was undefined");
        assert(!!process.env.dbSecretAccessKey, "db secret access key was undefined");
        assert(!!process.env.dbRegion, "db region was undefined");
        assert(!!process.env.dbTableName, "db table name was undefined");
        assert(!!process.env.connectionTableName, "db table name was undefined");
        assert(!!process.env.connectionTokenTableName, "CONNECTION_TOKEN_TABLE_NAME name was undefined");
        assert(!!process.env.dbEndpoint, "db endpoint was undefined");
        assert(!!process.env.expenseItemTableName, "EXPENSE_ITEM_TABLE_NAME was undefined");
        assert(!!process.env.expensePayerTableName, "Expense Payer table name was undefined");
        assert(!!process.env.expensePayerStatusTableName, "ExpensePayerStatus table name was undefined");
        assert(!!process.env.expenseTableName, "expenseTableName was undefined");
        assert(!!process.env.expenseGroupTableName, "expenseGroupTableName was undefined");
        assert(!!process.env.expenseGroupChildIndexName, "expenseGroupChildIndexName was undefined");
        assert(!!process.env.userExpenseTableName, "userExpenseTableName was undefined");
        assert(!!process.env.userExpenseUserIndexName, "userExpenseUserIndexName was undefined");
        assert(!!process.env.leadingExpenseTableName, "leadingExpenseTableName was undefined");
        this._dbAccessKeyId = process.env.dbAccessKeyId;
        this._dbSecretAccessKey = process.env.dbSecretAccessKey;
        this._dbRegion = process.env.dbRegion;
        this._tableName = process.env.dbTableName;
        this._connectionTableName = process.env.connectionTableName;
        this._endpoint = process.env.dbEndpoint;
        this.expenseItemTableName = process.env.expenseItemTableName;
        this.connectionTokenTableName = process.env.connectionTokenTableName;
        this.expensePayerTableName = process.env.expensePayerTableName;
        this.expensePayerStatusTableName = process.env.expensePayerStatusTableName;
        this.expenseTableName = process.env.expenseTableName;
        this.expenseGroupTableName = process.env.expenseGroupTableName;
        this.expenseGroupChildIndexName = process.env.expenseGroupChildIndexName;
        this.userExpenseTableName = process.env.userExpenseTableName;
        this.userExpenseUserIndexName = process.env.userExpenseUserIndexName;
        this.leadingExpenseTableName = process.env.leadingExpenseTableName;
    }

    get dbAccessKeyId(): string {
        return this._dbAccessKeyId;
    }

    get dbSecretAccessKey(): string {
        return this._dbSecretAccessKey;
    }

    get dbRegion(): string {
        return this._dbRegion;
    }

    get tableName(): string {
        return this._tableName;
    }

    get connectionTableName(): string {
        return this._connectionTableName;
    }

    get endpoint(): string {
        return this._endpoint;
    }
}
