import { assert } from "console";
import { IDbConfiguration } from "./db-configuration-interface";
import { injectable } from "inversify";

@injectable()
export class DbConfiguration implements IDbConfiguration {
    private readonly _dbRegion: string;
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
    readonly dbAccessKeyId: string;
    readonly dbSecretAccessKey: string;

    constructor() {
        assert(!!process.env.dbRegion, "db region was undefined");
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
        this._dbRegion = process.env.dbRegion;
        this._endpoint = process.env.dbEndpoint;
        this._connectionTableName = this.formatResourceName(process.env.connectionTableName);
        this.expenseItemTableName = this.formatResourceName(process.env.expenseItemTableName);
        this.connectionTokenTableName = this.formatResourceName(process.env.connectionTokenTableName);
        this.expensePayerTableName = this.formatResourceName(process.env.expensePayerTableName);
        this.expensePayerStatusTableName = this.formatResourceName(process.env.expensePayerStatusTableName);
        this.expenseTableName = this.formatResourceName(process.env.expenseTableName);
        this.expenseGroupTableName = this.formatResourceName(process.env.expenseGroupTableName);
        this.expenseGroupChildIndexName = process.env.expenseGroupChildIndexName;
        this.userExpenseTableName = this.formatResourceName(process.env.userExpenseTableName);
        this.userExpenseUserIndexName = process.env.userExpenseUserIndexName;
        this.leadingExpenseTableName = this.formatResourceName(process.env.leadingExpenseTableName);

        this.dbAccessKeyId = process.env.dbAccessKeyId === "null" ? undefined : process.env.dbAccessKeyId;
        this.dbSecretAccessKey = process.env.dbSecretAccessKey === "null" ? undefined : process.env.dbSecretAccessKey;
    }

    get dbRegion(): string {
        return this._dbRegion;
    }

    get connectionTableName(): string {
        return this._connectionTableName;
    }

    get endpoint(): string {
        return this._endpoint;
    }

    private formatResourceName(resourceName: string): string {
        console.log(`arn:aws:dynamodb:${process.env.dbRegion}:${process.env.dbAccountId}:table/${resourceName}`);
        return resourceName;
        
        // return process.env.AWS_ACCOUNT_ID !== process.env.dbAccountId
        //     ? `arn:aws:dynamodb:${process.env.dbRegion}:${process.env.dbAccountId}:table/${resourceName}`
        //     : resourceName;
    }
}
