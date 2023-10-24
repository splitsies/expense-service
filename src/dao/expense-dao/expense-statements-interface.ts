export interface IExpenseStatements {
    readonly GetExpenses: string;
}

export const IExpenseStatements = Symbol.for("IExpenseStatements");
