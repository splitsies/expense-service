export interface ILeadingExpenseValidator {
    validate(expenseId: string): Promise<boolean>;
}

export const ILeadingExpenseValidator = Symbol.for("ILeadingExpenseValidator");