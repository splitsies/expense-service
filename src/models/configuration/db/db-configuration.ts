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
    readonly pgPort: number;
    readonly pgHost: string;
    readonly pgDatabaseName: string;
    readonly connectionTokenTableName: string;

    constructor() {
        assert(!!process.env.dbAccessKeyId, "db access key was undefined");
        assert(!!process.env.dbSecretAccessKey, "db secret access key was undefined");
        assert(!!process.env.dbRegion, "db region was undefined");
        assert(!!process.env.dbTableName, "db table name was undefined");
        assert(!!process.env.connectionTableName, "db table name was undefined");
        assert(!!process.env.connectionTokenTableName, "CONNECTION_TOKEN_TABLE_NAME name was undefined");
        assert(!!process.env.dbEndpoint, "db endpoint was undefined");
        assert(!!process.env.expenseItemTableName, "EXPENSE_ITEM_TABLE_NAME was undefined");
        assert(!!process.env.pgPort, "PG_PORT was undefined");
        assert(!!process.env.pgHost, "PG_HOST was undefined");
        assert(!!process.env.pgDatabaseName, "PG_DATABASE_NAME was undefined");

        this._dbAccessKeyId = process.env.dbAccessKeyId;
        this._dbSecretAccessKey = process.env.dbSecretAccessKey;
        this._dbRegion = process.env.dbRegion;
        this._tableName = process.env.dbTableName;
        this._connectionTableName = process.env.connectionTableName;
        this._endpoint = process.env.dbEndpoint;
        this.expenseItemTableName = process.env.expenseItemTableName;
        this.pgPort = parseInt(process.env.pgPort);
        this.pgHost = process.env.pgHost;
        this.pgDatabaseName = process.env.pgDatabaseName;
        this.connectionTokenTableName = process.env.connectionTokenTableName;
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
