import { inject, injectable } from "inversify";
import { IExpenseOwnershipValidator } from "./expense-ownership-validator.i";
import { IUserExpenseDao } from "src/dao/user-expense-dao/user-expense-dao-interface";
import { UnauthorizedUserError } from "src/models/error/unauthorized-user-error";

@injectable()
export class ExpenseOwnershipValidator implements IExpenseOwnershipValidator {
    constructor(@inject(IUserExpenseDao) private readonly _dao: IUserExpenseDao) {}

    async validate(expenseId: string, userId: string): Promise<boolean> {
        const result = !!(await this._dao.read({ expenseId, userId }));
        if (!result) {
            throw new UnauthorizedUserError(`User=${userId} not authorized to access expense=${expenseId}`);
        }

        return result;
    }

    async validateForUserAdd(expenseId: string, userId: string, requestingUserId: string): Promise<boolean> {
        const userIsAddingSelf = userId === requestingUserId;
        const existingUserExpense = await this._dao.read({ userId: requestingUserId, expenseId });

        if (!userIsAddingSelf && !existingUserExpense) {
            throw new UnauthorizedUserError(`User=${requestingUserId} not authorized to access expense=${expenseId}`);
        }

        return true;
    }
}
