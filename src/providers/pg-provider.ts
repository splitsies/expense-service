import { injectable, inject } from "inversify";
import { IPgProvider } from "./pg-provider.i";
import postgres, { Sql } from "postgres";
import { IDbConfiguration } from "../models/configuration/db/db-configuration-interface";

@injectable()
export class PgProvider implements IPgProvider {
    private readonly _client: Sql;

    constructor(@inject(IDbConfiguration) private readonly _dbConfiguration: IDbConfiguration) {
        this._client = postgres({
            hostname: this._dbConfiguration.pgHost,
            port: this._dbConfiguration.pgPort,
            database: this._dbConfiguration.pgDatabaseName,
            idle_timeout: this._dbConfiguration.pgIdleTimeoutSec,
            max_lifetime: this._dbConfiguration.pgMaxLifetimeSec,
            max: this._dbConfiguration.pgMaxConnections,
        });
    }

    provide(): Sql {
        return this._client;
    }
}
