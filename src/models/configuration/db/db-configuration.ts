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

    constructor() {
        assert(!!process.env.dbAccessKeyId, "db access key was undefined");
        assert(!!process.env.dbSecretAccessKey, "db secret access key was undefined");
        assert(!!process.env.dbRegion, "db region was undefined");
        assert(!!process.env.dbTableName, "db table name was undefined");
        assert(!!process.env.connectionTableName, "db table name was undefined");
        assert(!!process.env.dbEndpoint, "db endpoint was undefined");

        this._dbAccessKeyId = process.env.dbAccessKeyId;
        this._dbSecretAccessKey = process.env.dbSecretAccessKey;
        this._dbRegion = process.env.dbRegion;
        this._tableName = process.env.dbTableName;
        this._connectionTableName = process.env.connectionTableName;
        this._endpoint = process.env.dbEndpoint;
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
