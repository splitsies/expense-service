export interface IDbConfiguration {
    readonly dbRegion: string;
    readonly expenseItemTableName: string;
    readonly connectionTableName: string;
    readonly endpoint: string;
    readonly connectionTokenTableName: string;
    readonly expensePayerTableName: string;
    readonly expensePayerStatusTableName: string;
    readonly expenseTableName: string;
    readonly expenseGroupTableName: string;
    readonly expenseGroupChildIndexName: string;
    readonly userExpenseTableName: string;
    readonly userExpenseUserIndexName: string;
    readonly leadingExpenseTableName: string;
}

export const IDbConfiguration = Symbol.for("IDbConfiguration");
