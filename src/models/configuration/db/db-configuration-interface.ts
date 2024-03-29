export interface IDbConfiguration {
    readonly dbAccessKeyId: string;
    readonly dbSecretAccessKey: string;
    readonly dbRegion: string;
    readonly tableName: string;
    readonly transactionDateIndexName: string;
    readonly connectionTableName: string;
    readonly userExpenseTableName: string;
    readonly expenseJoinRequestTableName: string;
    readonly endpoint: string;
}

export const IDbConfiguration = Symbol.for("IDbConfiguration");
