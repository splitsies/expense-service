import { inject, injectable } from "inversify";
import { IConnectionTokenDaoStatements } from "./connection-token-dao-statements-interface";
import { IDbConfiguration } from "src/models/configuration/db/db-configuration-interface";

@injectable()
export class ConnectionTokenDaoStatements implements IConnectionTokenDaoStatements {
    readonly GetExpiredConnections: string;

    constructor(@inject(IDbConfiguration) dbConfiguration: IDbConfiguration) {
        const table = dbConfiguration.connectionTokenTableName;
        this.GetExpiredConnections = `SELECT * FROM "${table}" WHERE ttl < ?`;
    }
}
