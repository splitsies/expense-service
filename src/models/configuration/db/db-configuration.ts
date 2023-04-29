import { assert } from "console";
import { IDbConfiguration } from "./db-configuration-interface";
import { injectable } from "inversify";

@injectable()
export class DbConfiguration implements IDbConfiguration {
    private readonly _dbAccessKeyId: string;
    private readonly _dbSecretAccessKey: string;
    private readonly _dbRegion: string;
    private readonly _tableName: string;

    constructor() {
        assert(!!process.env.dbAccessKeyId, "db access key was undefined");
        assert(!!process.env.dbSecretAccessKey, "db secret access key was undefined");
        assert(!!process.env.dbRegion, "db region was undefined");
        assert(!!process.env.tableName, "db table name was undefined");

        this._dbAccessKeyId = process.env.dbAccessKeyId;
        this._dbSecretAccessKey = process.env.dbSecretAccessKey;
        this._dbRegion = process.env.dbRegion;
        this._tableName = process.env.tableName;
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
}
