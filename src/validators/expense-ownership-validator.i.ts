export interface IExpenseOwnershipValidator {
    validate(expenseId: string, userId: string): Promise<boolean>;
}

export const IExpenseOwnershipValidator = Symbol.for("IExpenseOwnershipValidator");