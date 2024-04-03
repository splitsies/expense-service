export interface IDbConfiguration {
    readonly dbAccessKeyId: string;
    readonly dbSecretAccessKey: string;
    readonly dbRegion: string;
    readonly tableName: string;
    readonly expenseItemTableName: string;
    readonly connectionTableName: string;
    readonly expenseJoinRequestTableName: string;
    readonly endpoint: string;
    readonly pgHost: string;
    readonly pgPort: number;
    readonly pgDatabaseName: string;
    readonly connectionTokenTableName: string;
}

export const IDbConfiguration = Symbol.for("IDbConfiguration");
