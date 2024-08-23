export interface IExpenseOwnershipValidator {
    validate(expenseId: string, userId: string): Promise<boolean>;
    validateForUserAdd(expenseId: string, userId: string, requestingUserId: string): Promise<boolean>;
}

export const IExpenseOwnershipValidator = Symbol.for("IExpenseOwnershipValidator");