export interface IExpenseJoinRequestStatements {
    readonly GetForUser: string;
    readonly GetForExpense: string;
}
export const IExpenseJoinRequestStatements = Symbol.for("IExpenseJoinRequestStatements");
