export interface IDbConfiguration {
    readonly dbAccessKeyId: string;
    readonly dbSecretAccessKey: string;
    readonly dbRegion: string;
    readonly tableName: string;
    readonly expenseItemTableName: string;
    readonly connectionTableName: string;
    readonly endpoint: string;
    readonly pgHost: string;
    readonly pgPort: number;
    readonly pgIdleTimeoutSec: number;
    readonly pgMaxLifetimeSec: number;
    readonly pgMaxConnections: number;
    readonly pgDatabaseName: string;
    readonly connectionTokenTableName: string;
    readonly expensePayerTableName: string;
    readonly expensePayerStatusTableName: string;
}

export const IDbConfiguration = Symbol.for("IDbConfiguration");
